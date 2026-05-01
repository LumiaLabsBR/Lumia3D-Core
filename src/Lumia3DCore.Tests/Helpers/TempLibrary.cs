using Lumia3DCore.Data;
using Lumia3DCore.Services;

namespace Lumia3DCore.Tests.Helpers;

/// <summary>
/// Cria um ambiente isolado (dir temp + SQLite com migrations aplicadas)
/// para cada teste. Dispose limpa tudo.
/// </summary>
public sealed class TempLibrary : IDisposable
{
    public string LibraryPath  { get; }
    public string DbPath       { get; }
    public ObjectRepository Repository    { get; }
    public ThumbnailQueue   ThumbnailQueue { get; }
    public LibraryManager   Library        { get; }

    public TempLibrary()
    {
        LibraryPath = Path.Combine(Path.GetTempPath(), $"lumia_test_{Guid.NewGuid():N}");
        DbPath      = Path.Combine(LibraryPath, "test.db");
        Directory.CreateDirectory(LibraryPath);

        var runner = new MigrationRunner($"Data Source={DbPath};");
        runner.Run();

        Repository     = new ObjectRepository(DbPath, LibraryPath);
        ThumbnailQueue = new ThumbnailQueue(Repository, Path.Combine(LibraryPath, "Thumbnails"));
        Library        = new LibraryManager(LibraryPath, Repository, ThumbnailQueue);
    }

    public void Dispose()
    {
        ThumbnailQueue.Dispose();
        try { Directory.Delete(LibraryPath, recursive: true); } catch { }
    }
}
