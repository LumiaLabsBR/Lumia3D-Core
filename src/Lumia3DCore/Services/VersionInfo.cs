using System;
using System.IO;
using System.Reflection;

namespace Lumia3DCore.Services;

/// <summary>
/// Informações de versão da aplicação, lidas do assembly em runtime.
/// </summary>
public static class VersionInfo
{
    private static readonly Assembly _asm = Assembly.GetExecutingAssembly();

    /// <summary>
    /// Versão semântica (ex: "0.1.0-alpha.1" ou "1.0.0").
    /// Pode incluir sufixo +commit se <SourceRevisionId> foi definido no build.
    /// </summary>
    public static string Current { get; } = _asm
        .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
        ?.InformationalVersion
        ?? "0.0.0";

    /// <summary>
    /// Apenas o número de versão sem sufixo de pré-release ou metadata de build.
    /// </summary>
    public static string Short { get; } = Current.Split('+', '-')[0];

    /// <summary>
    /// Commit SHA (7 chars) embutido pelo CI via +sha no InformationalVersion.
    /// Retorna "local" quando não disponível (build fora do CI).
    /// </summary>
    public static string Commit { get; } = ExtractCommit(Current);

    /// <summary>
    /// Data de build: última modificação do executável (proxy confiável no self-contained).
    /// </summary>
    public static string BuildDate { get; } = ResolveBuildDate();

    private static string ExtractCommit(string version)
    {
        int plus = version.IndexOf('+');
        if (plus >= 0 && version.Length > plus + 1)
        {
            string sha = version.Substring(plus + 1);
            return sha.Length >= 7 ? sha.Substring(0, 7) : sha;
        }
        return "local";
    }

    private static string ResolveBuildDate()
    {
        try
        {
            string? asmPath = _asm.Location;
            if (!string.IsNullOrEmpty(asmPath) && File.Exists(asmPath))
                return File.GetLastWriteTimeUtc(asmPath).ToString("yyyy-MM-dd");
        }
        catch { }
        return DateTime.UtcNow.ToString("yyyy-MM-dd");
    }
}
