using Dapper;
using Microsoft.Data.Sqlite;

namespace Lumia3DCore.Data;

/// <summary>
/// Cria e inicializa o schema SQLite incluindo tabelas, índice FTS5 e triggers.
/// </summary>
/// <remarks>
/// Schema é criado idempotentemente via <c>CREATE TABLE IF NOT EXISTS</c>.
/// A infraestrutura de migrations propriamente dita é introduzida na Fase 2 do plano
/// (vide <c>PLAN.md</c>) — esta classe é o ponto de integração.
/// </remarks>
public class DatabaseInitializer
{
    private readonly string _connectionString;

    public DatabaseInitializer(string dbPath)
    {
        _connectionString = $"Data Source={dbPath};";
    }

    public void Initialize()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        // Foreign keys precisam ser explicitamente habilitadas no SQLite
        connection.Execute("PRAGMA foreign_keys = ON;");

        var createCategoryTable = @"
            CREATE TABLE IF NOT EXISTS Category (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                ParentCategoryId INTEGER,
                SortOrder INTEGER DEFAULT 0,
                FOREIGN KEY(ParentCategoryId) REFERENCES Category(Id)
            );";

        var createObject3DTable = @"
            CREATE TABLE IF NOT EXISTS Object3D (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Description TEXT,
                MainFilePath TEXT NOT NULL,
                FileType TEXT NOT NULL,
                ThumbnailPath TEXT,
                Hash TEXT NOT NULL,
                CategoryId INTEGER,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(CategoryId) REFERENCES Category(Id)
            );";

        // FTS5 indexa Nome, Descrição e Filename original (Phase 6 do plano).
        var createObjectFtsTable = @"
            CREATE VIRTUAL TABLE IF NOT EXISTS Object3D_FTS USING fts5(
                Name,
                Description,
                Filename,
                content='Object3D',
                content_rowid='Id'
            );";

        var createTriggers = @"
            CREATE TRIGGER IF NOT EXISTS Object3D_ai AFTER INSERT ON Object3D BEGIN
                INSERT INTO Object3D_FTS(rowid, Name, Description, Filename)
                VALUES (new.Id, new.Name, new.Description, new.MainFilePath);
            END;
            CREATE TRIGGER IF NOT EXISTS Object3D_ad AFTER DELETE ON Object3D BEGIN
                INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename)
                VALUES('delete', old.Id, old.Name, old.Description, old.MainFilePath);
            END;
            CREATE TRIGGER IF NOT EXISTS Object3D_au AFTER UPDATE ON Object3D BEGIN
                INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename)
                VALUES('delete', old.Id, old.Name, old.Description, old.MainFilePath);
                INSERT INTO Object3D_FTS(rowid, Name, Description, Filename)
                VALUES (new.Id, new.Name, new.Description, new.MainFilePath);
            END;
        ";

        var createTagTable = @"
            CREATE TABLE IF NOT EXISTS Tag (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL UNIQUE,
                Color TEXT
            );";

        var createObjectTagTable = @"
            CREATE TABLE IF NOT EXISTS ObjectTag (
                ObjectId INTEGER NOT NULL,
                TagId INTEGER NOT NULL,
                PRIMARY KEY (ObjectId, TagId),
                FOREIGN KEY(ObjectId) REFERENCES Object3D(Id) ON DELETE CASCADE,
                FOREIGN KEY(TagId) REFERENCES Tag(Id) ON DELETE CASCADE
            );";

        var createAttachmentTable = @"
            CREATE TABLE IF NOT EXISTS Attachment (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                ObjectId INTEGER NOT NULL,
                FilePath TEXT NOT NULL,
                Type TEXT NOT NULL,
                FOREIGN KEY(ObjectId) REFERENCES Object3D(Id) ON DELETE CASCADE
            );";

        connection.Execute(createCategoryTable);
        connection.Execute(createObject3DTable);
        connection.Execute(createObjectFtsTable);
        connection.Execute(createTriggers);
        connection.Execute(createTagTable);
        connection.Execute(createObjectTagTable);
        connection.Execute(createAttachmentTable);
    }
}
