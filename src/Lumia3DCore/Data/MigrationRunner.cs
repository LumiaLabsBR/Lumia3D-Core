using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Data.Sqlite;

namespace Lumia3DCore.Data;

/// <summary>
/// Aplica migrations SQL embutidas como recursos do assembly.
/// Convenção de arquivo: <c>Lumia3DCore.Data.Migrations.NNN_descricao.sql</c>
/// onde NNN é o número de versão com zero-padding (001, 002, …).
/// Cada statement dentro do SQL é separado por uma linha contendo <c>-- split</c>.
/// </summary>
public class MigrationRunner
{
    private const string SchemaVersionTable = @"
        CREATE TABLE IF NOT EXISTS SchemaVersion (
            Version   INTEGER  PRIMARY KEY,
            AppliedAt TEXT     NOT NULL
        );";

    private readonly string _connectionString;

    public MigrationRunner(string connectionString)
    {
        _connectionString = connectionString;
    }

    /// <summary>
    /// Aplica todas as migrations pendentes. Seguro para executar em cada startup.
    /// </summary>
    /// <returns>Número de migrations aplicadas nesta execução.</returns>
    public int Run()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        // WAL mode: melhora leitura concorrente e reduz lock contention.
        connection.Execute("PRAGMA journal_mode=WAL;");
        connection.Execute("PRAGMA foreign_keys=ON;");

        // Garante que a tabela de controle existe.
        connection.Execute(SchemaVersionTable);

        int currentVersion = connection.QuerySingleOrDefault<int?>(
            "SELECT MAX(Version) FROM SchemaVersion;") ?? 0;

        // Se o banco já tinha dados mas não tinha SchemaVersion,
        // detecta pelo Object3D e trata como versão 1 já aplicada.
        if (currentVersion == 0 && TableExists(connection, "Object3D"))
        {
            MarkApplied(connection, 1);
            currentVersion = 1;
        }

        var pending = GetPendingMigrations(currentVersion);
        foreach (var (version, name, sql) in pending)
        {
            ApplyMigration(connection, version, name, sql);
        }

        return pending.Count;
    }

    private static bool TableExists(SqliteConnection connection, string tableName)
        => connection.QuerySingleOrDefault<int>(
               "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=@name;",
               new { name = tableName }) > 0;

    private static void MarkApplied(SqliteConnection connection, int version)
        => connection.Execute(
               "INSERT OR IGNORE INTO SchemaVersion (Version, AppliedAt) VALUES (@v, @ts);",
               new { v = version, ts = DateTime.UtcNow.ToString("O") });

    private List<(int Version, string Name, string Sql)> GetPendingMigrations(int currentVersion)
    {
        var asm = Assembly.GetExecutingAssembly();
        var prefix = "Lumia3DCore.Data.Migrations.";

        var migrations = asm.GetManifestResourceNames()
            .Where(r => r.StartsWith(prefix, StringComparison.Ordinal) && r.EndsWith(".sql", StringComparison.Ordinal))
            .Select(resourceName =>
            {
                string file = resourceName.Substring(prefix.Length); // e.g. "001_initial.sql"
                var match = Regex.Match(file, @"^(\d+)_");
                if (!match.Success) return ((int Version, string Name, string Sql)?)null;
                int version = int.Parse(match.Groups[1].Value);
                if (version <= currentVersion) return null;
                string sql = ReadResource(asm, resourceName);
                return (version, file.Replace(".sql", ""), sql);
            })
            .Where(m => m.HasValue)
            .Select(m => m!.Value)
            .OrderBy(m => m.Version)
            .ToList();

        return migrations;
    }

    private static string ReadResource(Assembly asm, string resourceName)
    {
        using var stream = asm.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Recurso não encontrado: {resourceName}");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    private static void ApplyMigration(SqliteConnection connection, int version, string name, string sql)
    {
        // Divide o SQL em statements separados por linhas "-- split"
        var statements = sql
            .Split(new[] { "-- split" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(s => s.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();

        using var transaction = connection.BeginTransaction();
        try
        {
            foreach (var stmt in statements)
                connection.Execute(stmt, transaction: transaction);

            MarkApplied(connection, version);
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}
