using System;
using System.IO;

namespace Lumia3DCore.Services;

/// <summary>
/// Logger estático com rotação de arquivo.
/// Inicialize com <see cref="Initialize"/> antes de qualquer uso.
/// Arquivo: <c>%APPDATA%/Lumia3DCore/logs/app.log</c>
/// Rotação: 10 MB por arquivo, máximo 5 arquivos.
/// </summary>
public static class AppLogger
{
    private static readonly object _lock = new();
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;
    private const int MaxFiles = 5;
    private static string? _logPath;

    public static void Initialize(string logDirectory)
    {
        Directory.CreateDirectory(logDirectory);
        _logPath = Path.Combine(logDirectory, "app.log");
    }

    public static void Info(string message)  => Write("INFO ", message, null);
    public static void Warn(string message)  => Write("WARN ", message, null);
    public static void Error(string message, Exception? ex = null) => Write("ERROR", message, ex);
    public static void Debug(string message) => Write("DEBUG", message, null);

    private static void Write(string level, string message, Exception? ex)
    {
        if (_logPath == null) return;
        try
        {
            string entry = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss.fff}Z] [{level}] {message}";
            if (ex != null) entry += $"\n{ex}";

            lock (_lock)
            {
                RotateIfNeeded();
                File.AppendAllText(_logPath, entry + "\n");
            }
        }
        catch { /* não-fatal */ }
    }

    private static void RotateIfNeeded()
    {
        if (_logPath == null || !File.Exists(_logPath)) return;
        if (new FileInfo(_logPath).Length < MaxFileSizeBytes) return;

        for (int i = MaxFiles - 1; i >= 1; i--)
        {
            string older = RotatedPath(i);
            string newer = RotatedPath(i + 1);
            if (File.Exists(older))
            {
                if (File.Exists(newer)) File.Delete(newer);
                File.Move(older, newer);
            }
        }
        string first = RotatedPath(1);
        if (File.Exists(first)) File.Delete(first);
        File.Move(_logPath, first);
    }

    private static string RotatedPath(int n)
    {
        string dir  = Path.GetDirectoryName(_logPath)!;
        string stem = Path.GetFileNameWithoutExtension(_logPath)!;
        return Path.Combine(dir, $"{stem}.{n}.log");
    }
}
