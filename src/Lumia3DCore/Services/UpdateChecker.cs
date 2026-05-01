using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Lumia3DCore.Services;

/// <summary>
/// Verifica e baixa atualizações do GitHub Releases.
/// Opt-in: só usado quando AutoCheckUpdates = true em UserSettings.
/// </summary>
public static class UpdateChecker
{
    private const string LatestReleaseUrl =
        "https://api.github.com/repos/LumiaLabsBR/Lumia3D-Core/releases/latest";
    private const string AllReleasesUrl =
        "https://api.github.com/repos/LumiaLabsBR/Lumia3D-Core/releases";

    private static readonly HttpClient _http;

    static UpdateChecker()
    {
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        _http.DefaultRequestHeaders.Add("User-Agent",              $"Lumia3DCore/{VersionInfo.Short}");
        _http.DefaultRequestHeaders.Add("Accept",                  "application/vnd.github+json");
        _http.DefaultRequestHeaders.Add("X-GitHub-Api-Version",    "2022-11-28");
    }

    public record UpdateInfo(
        string TagName,
        string Version,
        string InstallerUrl,
        string Sha256Url,
        long   InstallerSize,
        string ReleaseNotes
    );

    /// <summary>
    /// Consulta a API do GitHub e retorna informações de update, ou null se já estiver na versão atual.
    /// </summary>
    public static async Task<UpdateInfo?> CheckAsync(bool includePreReleases, CancellationToken ct = default)
    {
        try
        {
            string url = includePreReleases ? AllReleasesUrl : LatestReleaseUrl;
            using var resp = await _http.GetAsync(url, ct).ConfigureAwait(false);
            resp.EnsureSuccessStatusCode();

            using var stream = await resp.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct).ConfigureAwait(false);

            JsonElement release;
            if (includePreReleases)
            {
                if (doc.RootElement.GetArrayLength() == 0) return null;
                release = doc.RootElement[0];
            }
            else
            {
                release = doc.RootElement;
            }

            string tagName       = release.TryGetProperty("tag_name", out var tn) ? tn.GetString() ?? "" : "";
            string releaseNotes  = release.TryGetProperty("body",     out var bn) ? bn.GetString() ?? "" : "";
            string latestVersion = tagName.TrimStart('v');

            if (latestVersion == VersionInfo.Short) return null;

            string installerUrl  = "";
            string sha256Url     = "";
            long   installerSize = 0;

            if (release.TryGetProperty("assets", out var assets))
            {
                foreach (var asset in assets.EnumerateArray())
                {
                    string name = asset.TryGetProperty("name",                 out var np) ? np.GetString() ?? "" : "";
                    string dlUrl = asset.TryGetProperty("browser_download_url", out var dp) ? dp.GetString() ?? "" : "";

                    if (name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) &&
                        name.Contains("Setup", StringComparison.OrdinalIgnoreCase))
                    {
                        installerUrl  = dlUrl;
                        installerSize = asset.TryGetProperty("size", out var sp) ? sp.GetInt64() : 0;
                    }
                    else if (name.EndsWith(".sha256", StringComparison.OrdinalIgnoreCase))
                    {
                        sha256Url = dlUrl;
                    }
                }
            }

            if (string.IsNullOrEmpty(installerUrl)) return null;

            return new UpdateInfo(tagName, latestVersion, installerUrl, sha256Url, installerSize, releaseNotes);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            AppLogger.Warn($"UpdateChecker.CheckAsync: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Baixa o instalador, verifica SHA256 (se disponível) e o executa.
    /// Lança exceção em caso de falha; o chamador deve lidar com cancelamento.
    /// </summary>
    public static async Task DownloadAndInstallAsync(
        UpdateInfo info,
        Action<long, long> onProgress,
        CancellationToken ct)
    {
        string tempDir = Path.Combine(Path.GetTempPath(), "Lumia3DCore_Update");
        Directory.CreateDirectory(tempDir);

        // Path traversal defense: usar APENAS o filename sem componentes de path,
        // e validar que o resultado fica dentro de tempDir antes de baixar/executar.
        string rawName = Uri.TryCreate(info.InstallerUrl, UriKind.Absolute, out var uri)
            ? Path.GetFileName(uri.LocalPath)
            : "Lumia3DCore-Setup.exe";

        string safeName = Path.GetFileName(rawName); // descarta qualquer ../ residual
        if (string.IsNullOrWhiteSpace(safeName) ||
            !safeName.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) ||
            safeName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        {
            safeName = "Lumia3DCore-Setup.exe";
        }

        string installerPath = Path.GetFullPath(Path.Combine(tempDir, safeName));
        string normalizedTempDir = Path.GetFullPath(tempDir) + Path.DirectorySeparatorChar;
        if (!installerPath.StartsWith(normalizedTempDir, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                $"Path do instalador escapa do diretório temp: {installerPath}");

        try
        {
            AppLogger.Info($"Baixando update {info.TagName} → {installerPath}");
            await DownloadWithProgressAsync(info.InstallerUrl, installerPath, info.InstallerSize, onProgress, ct)
                .ConfigureAwait(false);

            // Verificação SHA256 (quando disponível)
            if (!string.IsNullOrEmpty(info.Sha256Url))
            {
                string raw      = await _http.GetStringAsync(info.Sha256Url, ct).ConfigureAwait(false);
                string expected = raw.Trim().Split(' ', '\t')[0].ToLowerInvariant();
                string actual   = ComputeSha256(installerPath);
                if (actual != expected)
                    throw new InvalidDataException(
                        $"SHA256 não confere. Esperado: {expected}  Obtido: {actual}");
                AppLogger.Info("SHA256 verificado com sucesso.");
            }

            // Lança instalador e permite que o app feche
            Process.Start(new ProcessStartInfo
            {
                FileName        = installerPath,
                UseShellExecute = true,
            });
        }
        catch
        {
            try { if (File.Exists(installerPath)) File.Delete(installerPath); } catch { }
            throw;
        }
    }

    private static async Task DownloadWithProgressAsync(
        string url, string destPath, long totalBytes,
        Action<long, long> onProgress, CancellationToken ct)
    {
        using var resp = await _http
            .GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct)
            .ConfigureAwait(false);
        resp.EnsureSuccessStatusCode();

        long total = totalBytes > 0
            ? totalBytes
            : resp.Content.Headers.ContentLength ?? -1;

        using var src  = await resp.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        using var dest = File.Create(destPath);
        var buf      = new byte[81_920];
        long received = 0;
        int  read;
        while ((read = await src.ReadAsync(buf, ct).ConfigureAwait(false)) > 0)
        {
            await dest.WriteAsync(buf.AsMemory(0, read), ct).ConfigureAwait(false);
            received += read;
            onProgress(received, total);
        }
    }

    private static string ComputeSha256(string filePath)
    {
        using var sha256 = SHA256.Create();
        using var stream = File.OpenRead(filePath);
        return BitConverter.ToString(sha256.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
    }
}
