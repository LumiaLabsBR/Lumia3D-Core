using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Lumia3DCore.Services;

/// <summary>
/// Configurações persistentes do usuário, gravadas como JSON em
/// <c>%APPDATA%/Lumia3DCore/settings.json</c> (Windows) ou
/// <c>~/.config/Lumia3DCore/settings.json</c> (Linux/macOS).
/// </summary>
public class UserSettings
{
    // Janela
    public double WindowX { get; set; } = double.NaN;
    public double WindowY { get; set; } = double.NaN;
    public double WindowWidth { get; set; } = 1280;
    public double WindowHeight { get; set; } = 800;
    public bool IsMaximized { get; set; }
    public double SidebarWidth { get; set; } = 260;

    // Visual
    public string Theme { get; set; } = "dark";        // dark | light | contrast
    public string Density { get; set; } = "comfortable"; // comfortable | compact
    public string ViewMode { get; set; } = "gallery";  // gallery | list
    public string SortOrder { get; set; } = "DateDesc";

    // Bibliotecas
    public string LastRepositoryPath { get; set; } = string.Empty;
    public List<string> RecentRepositories { get; set; } = new();

    // Updates (Lumia3D Core: opt-in, desligado por default)
    public bool AutoCheckUpdates { get; set; } = false;
    public bool IncludePreReleases { get; set; } = false;
    public DateTime? LastUpdateCheck { get; set; }

    // Performance
    public int? ThumbnailWorkerCount { get; set; } // null = auto (cores - 1)

    public void AddRecentRepository(string path)
    {
        RecentRepositories.Remove(path);
        RecentRepositories.Insert(0, path);
        if (RecentRepositories.Count > 10)
            RecentRepositories.RemoveRange(10, RecentRepositories.Count - 10);
        LastRepositoryPath = path;
    }

    public static string GetAppDataDirectory()
    {
        string baseDir = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string appData = Path.Combine(baseDir, "Lumia3DCore");
        Directory.CreateDirectory(appData);
        return appData;
    }

    private static string GetSettingsPath() => Path.Combine(GetAppDataDirectory(), "settings.json");

    public static UserSettings Load()
    {
        try
        {
            string path = GetSettingsPath();
            if (File.Exists(path))
            {
                string json = File.ReadAllText(path);
                return JsonSerializer.Deserialize<UserSettings>(json) ?? new UserSettings();
            }
        }
        catch
        {
            // Configurações corrompidas → retorna defaults
        }
        return new UserSettings();
    }

    public void Save()
    {
        try
        {
            string path = GetSettingsPath();
            var options = new JsonSerializerOptions { WriteIndented = true };
            File.WriteAllText(path, JsonSerializer.Serialize(this, options));
        }
        catch
        {
            // Falha ao salvar é não-fatal; ignorada silenciosamente
        }
    }
}
