using System;
using System.IO;
using Microsoft.Data.Sqlite;

namespace Lumia3DCore.Data;

/// <summary>
/// Ponto de entrada para inicialização do banco SQLite.
/// Realiza backup antes de migrations e delega ao <see cref="MigrationRunner"/>.
/// </summary>
public class DatabaseInitializer
{
    private readonly string _dbPath;
    private readonly string _connectionString;

    public DatabaseInitializer(string dbPath)
    {
        _dbPath = dbPath;
        _connectionString = $"Data Source={dbPath};";
    }

    /// <summary>
    /// Inicializa (ou migra) o banco. Seguro para chamar a cada startup.
    /// </summary>
    public void Initialize()
    {
        bool isExisting = File.Exists(_dbPath);
        if (isExisting)
            BackupIfNeeded();

        var runner = new MigrationRunner(_connectionString);
        runner.Run();
    }

    /// <summary>
    /// Cria um backup timestampado antes de aplicar migrations.
    /// Mantém apenas os 3 backups mais recentes.
    /// </summary>
    private void BackupIfNeeded()
    {
        try
        {
            string dir = Path.GetDirectoryName(_dbPath) ?? ".";
            string baseName = Path.GetFileNameWithoutExtension(_dbPath);

            // Verifica se há alguma migration pendente antes de fazer backup desnecessário.
            // (Simples heurística: copia sempre que o banco já existe e o runner vai rodar.)
            string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
            string backupPath = Path.Combine(dir, $"{baseName}.backup-{timestamp}.db");
            File.Copy(_dbPath, backupPath, overwrite: false);

            PruneOldBackups(dir, baseName);
        }
        catch
        {
            // Backup falha → não bloqueia a inicialização; bank original intacto.
        }
    }

    private static void PruneOldBackups(string dir, string baseName)
    {
        try
        {
            var backups = Directory.GetFiles(dir, $"{baseName}.backup-*.db");
            Array.Sort(backups); // ordem lexicográfica = cronológica com timestamp yyyyMMdd-HHmmss
            int excess = backups.Length - 3;
            for (int i = 0; i < excess; i++)
                File.Delete(backups[i]);
        }
        catch { }
    }
}
