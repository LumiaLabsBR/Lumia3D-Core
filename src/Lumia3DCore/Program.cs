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
        string libraryPath = ResolveLibraryPath(appData);
        string dbPath = Path.Combine(appData, "library.db");

        // ── Inicializar banco ────────────────────────────────────────────
        var dbInit = new DatabaseInitializer(dbPath);
        dbInit.Initialize();

        // ── Inicializar serviços ─────────────────────────────────────────
        var repository = new ObjectRepository(dbPath, libraryPath);
        var library    = new LibraryManager(libraryPath, repository);
        var ipc        = new IpcBridge(repository, library);

        // ── URL do frontend ──────────────────────────────────────────────
        // Em Debug, usa o Vite dev server (npm run dev deve estar rodando).
        // Em Release, carrega o build estático de wwwroot/.
        string frontendUrl = ResolveFrontendUrl();

        // ── Janela Photino ───────────────────────────────────────────────
        var settings = UserSettings.Load();

        var window = new PhotinoWindow()
            .SetTitle(AppName)
            .SetWidth((int)settings.WindowWidth)
            .SetHeight((int)settings.WindowHeight)
            .SetDevToolsEnabled(IsDebug())
            .SetContextMenuEnabled(IsDebug())
            .RegisterWebMessageReceivedHandler((object? sender, string message) =>
            {
                string responseJson = ipc.Handle(message);
                ((PhotinoWindow)sender!).SendWebMessage(responseJson);
            });

        if (!double.IsNaN(settings.WindowX) && !double.IsNaN(settings.WindowY))
        {
            window.SetLeft((int)settings.WindowX)
                  .SetTop((int)settings.WindowY);
        }

        if (settings.IsMaximized)
            window.SetMaximized(true);

        // Salvar posição ao fechar
        window.RegisterWindowClosingHandler((object sender, EventArgs args) =>
        {
            var w = (PhotinoWindow)sender;
            var s = UserSettings.Load();
            s.WindowWidth  = w.Width;
            s.WindowHeight = w.Height;
            s.WindowX      = w.Left;
            s.WindowY      = w.Top;
            s.Save();
            return false; // false = permitir fechar
        });

        if (frontendUrl.StartsWith("http"))
            window.Load(new Uri(frontendUrl));
        else
            window.Load(new Uri(frontendUrl));

        window.WaitForClose();
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
