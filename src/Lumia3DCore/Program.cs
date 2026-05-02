using System;
using System.IO;
using System.Runtime.InteropServices;
using Lumia3DCore.Data;
using Lumia3DCore.Ipc;
using Lumia3DCore.Services;
using PhotinoNET;

namespace Lumia3DCore;

internal static class Program
{
    private const string AppName = "Lumia3D Core";
    private const string AppVersion = "0.1.0-alpha.1";

    [STAThread]
    private static void Main(string[] args)
    {
        try
        {
            Run();
        }
        catch (Exception ex)
        {
            WriteFatalLog(ex);
            throw;
        }
    }

    private static void Run()
    {
        // ── Paths ────────────────────────────────────────────────────────
        string appData = UserSettings.GetAppDataDirectory();
        string logsDir = Path.Combine(appData, "logs");
        AppLogger.Initialize(logsDir);
        AppLogger.Info($"{AppName} {AppVersion} iniciando");

        string libraryPath = ResolveLibraryPath(appData);
        string dbPath = Path.Combine(appData, "library.db");

        // ── Inicializar banco ────────────────────────────────────────────
        var dbInit = new DatabaseInitializer(dbPath);
        dbInit.Initialize();

        // ── Inicializar serviços ─────────────────────────────────────────
        var repository     = new ObjectRepository(dbPath, libraryPath);
        var thumbnailQueue = new ThumbnailQueue(repository, System.IO.Path.Combine(libraryPath, "Thumbnails"));
        var library        = new LibraryManager(libraryPath, repository, thumbnailQueue);
        var ipc            = new IpcBridge(repository, library);

        // ── URL do frontend ──────────────────────────────────────────────
        // Em Debug, usa o Vite dev server (npm run dev deve estar rodando).
        // Em Release, carrega o build estático de wwwroot/.
        string frontendUrl = ResolveFrontendUrl();

        // ── Janela Photino ───────────────────────────────────────────────
        var settings = UserSettings.Load();

        string iconPath = Path.Combine(AppContext.BaseDirectory, "Assets", "icon.ico");

        // Sanitiza geometria da janela: settings.json corrompido (DPI, minimização,
        // off-screen) pode salvar valores degenerados. Reseta TUDO se qualquer
        // dimensão suspeita aparece.
        const int MinW = 900, MinH = 600;
        const int DefaultW = 1280, DefaultH = 800;

        int width  = (int)settings.WindowWidth;
        int height = (int)settings.WindowHeight;
        int? left  = double.IsNaN(settings.WindowX) ? null : (int?)settings.WindowX;
        int? top   = double.IsNaN(settings.WindowY) ? null : (int?)settings.WindowY;

        bool sane = width >= MinW && height >= MinH
                 && width  <= 16000 && height <= 16000
                 && (!left.HasValue  || (left.Value  > -10000 && left.Value  < 16000))
                 && (!top.HasValue   || (top.Value   > -10000 && top.Value   < 16000));

        AppLogger.Info($"Window settings load: w={width} h={height} x={left?.ToString() ?? "?"} y={top?.ToString() ?? "?"} sane={sane}");

        if (!sane)
        {
            AppLogger.Warn("Window geometry corrupted — resetando para default centralizado");
            width  = DefaultW;
            height = DefaultH;
            left   = null;
            top    = null;
        }

        var window = new PhotinoWindow()
            .SetTitle(AppName)
            .SetWidth(width)
            .SetHeight(height)
            .SetMinWidth(MinW)
            .SetMinHeight(MinH)
            // DevTools sempre habilitado em alpha/beta pra facilitar bug report.
            // Usuario pressiona F12 ou Ctrl+Shift+I pra abrir.
            .SetDevToolsEnabled(true)
            .SetContextMenuEnabled(true)
            .SetIconFile(File.Exists(iconPath) ? iconPath : string.Empty)
            .RegisterWebMessageReceivedHandler((object? sender, string message) =>
            {
                string responseJson = ipc.Handle(message);
                ((PhotinoWindow)sender!).SendWebMessage(responseJson);
            });

        if (left.HasValue && top.HasValue && sane)
        {
            window.SetLeft(left.Value).SetTop(top.Value);
        }
        else
        {
            // Sem posição válida → centraliza
            window.Center();
        }

        if (settings.IsMaximized && sane)
            window.SetMaximized(true);

        // Salvar geometria ao fechar — APENAS se sã (evita persistir ruído)
        window.RegisterWindowClosingHandler((object sender, EventArgs args) =>
        {
            var w = (PhotinoWindow)sender;
            var s = UserSettings.Load();
            int cw = w.Width, ch = w.Height, cx = w.Left, cy = w.Top;
            if (cw >= MinW && ch >= MinH && cx > -10000 && cy > -10000)
            {
                s.WindowWidth  = cw;
                s.WindowHeight = ch;
                s.WindowX      = cx;
                s.WindowY      = cy;
                s.Save();
            }
            else
            {
                AppLogger.Warn($"Window close: geometria invalida ({cw}x{ch}+{cx},{cy}) — nao salvando");
            }
            return false;
        });

        // Conecta push C# → frontend e notificações de thumbnail
        ipc.SetPushAction(msg => window.SendWebMessage(msg));
        thumbnailQueue.OnThumbnailReady = (objectId, path) =>
            ipc.Push(new { @event = "thumbnailReady", objectId, thumbnailPath = path });

        // Controles de janela disparados pelo frontend (custom title bar)
        ipc.SetWindowAction(action =>
        {
            try
            {
                switch (action)
                {
                    case "minimize": window.SetMinimized(true); break;
                    case "maximize": window.SetMaximized(!window.Maximized); break;
                    case "close":    window.Close(); break;
                    case "resetSize":
                        // Restaura tamanho/posição padrão e limpa do settings.json
                        window.SetWidth(DefaultW).SetHeight(DefaultH);
                        window.Center();
                        var s = UserSettings.Load();
                        s.WindowWidth  = DefaultW;
                        s.WindowHeight = DefaultH;
                        s.WindowX      = double.NaN;
                        s.WindowY      = double.NaN;
                        s.IsMaximized  = false;
                        s.Save();
                        AppLogger.Info("Window: resetSize aplicado");
                        break;
                }
            }
            catch (Exception ex) { AppLogger.Warn($"WindowAction '{action}' falhou: {ex.Message}"); }
        });

        // Auto-check de update (opt-in, throttled a 24 h)
        if (settings.AutoCheckUpdates)
        {
            bool stale = !settings.LastUpdateCheck.HasValue ||
                         (DateTime.UtcNow - settings.LastUpdateCheck.Value).TotalHours >= 24;
            if (stale)
                _ = ipc.RunUpdateCheckAsync(settings.IncludePreReleases);
        }

        if (frontendUrl.StartsWith("http"))
            window.Load(new Uri(frontendUrl));
        else
            window.Load(new Uri(frontendUrl));

        window.WaitForClose();
        thumbnailQueue.Dispose();
    }

    private static string ResolveFrontendUrl()
    {
        if (IsDebug())
            return "http://localhost:5173";

        // wwwroot é copiado ao lado do executável pelo MSBuild
        string exe = AppContext.BaseDirectory;
        string index = Path.Combine(exe, "wwwroot", "index.html");
        if (!File.Exists(index))
            throw new FileNotFoundException(
                "Frontend não encontrado. Execute 'npm run build' em src/Lumia3DCore.Web/ antes de publicar.",
                index);

        return new Uri(index).AbsoluteUri;
    }

    private static string ResolveLibraryPath(string appData)
    {
        var settings = UserSettings.Load();
        if (!string.IsNullOrEmpty(settings.LastRepositoryPath) &&
            Directory.Exists(settings.LastRepositoryPath))
            return settings.LastRepositoryPath;

        // Default: ~/Documents/Lumia3D Libraries/Minha Biblioteca/
        string docs = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        string defaultPath = Path.Combine(docs, "Lumia3D Libraries", "Minha Biblioteca");
        Directory.CreateDirectory(defaultPath);
        return defaultPath;
    }

    private static bool IsDebug()
    {
#if DEBUG
        return true;
#else
        return false;
#endif
    }

    private static void WriteFatalLog(Exception ex)
    {
        try
        {
            string logsDir = Path.Combine(UserSettings.GetAppDataDirectory(), "logs");
            Directory.CreateDirectory(logsDir);
            string logPath = Path.Combine(logsDir, $"crash-{DateTime.UtcNow:yyyyMMdd-HHmmss}.log");
            File.WriteAllText(logPath,
                $"[{DateTime.UtcNow:O}] {AppName} {AppVersion} crash\n{ex}");
        }
        catch { /* não-fatal */ }
    }
}
