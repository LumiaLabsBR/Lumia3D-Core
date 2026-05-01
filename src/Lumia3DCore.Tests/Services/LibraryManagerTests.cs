using FluentAssertions;
using Lumia3DCore.Tests.Helpers;

namespace Lumia3DCore.Tests.Services;

public class LibraryManagerTests : IDisposable
{
    private readonly TempLibrary _env = new();

    public void Dispose() => _env.Dispose();

    // ── ImportFile ────────────────────────────────────────────────────────────

    [Fact]
    public void ImportFile_NonExistentPath_ReturnsNull()
        => _env.Library.ImportFile(Path.Combine(_env.LibraryPath, "nope.stl")).Should().BeNull();

    [Fact]
    public void ImportFile_ValidStl_ReturnsObject()
    {
        string src = WriteTempStl("cube.stl");
        var obj = _env.Library.ImportFile(src);
        obj.Should().NotBeNull();
        obj!.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public void ImportFile_SetsNameFromFilename()
    {
        string src = WriteTempStl("iron_man_helmet.stl");
        var obj = _env.Library.ImportFile(src);
        obj!.Name.Should().Be("Iron Man Helmet");
    }

    [Fact]
    public void ImportFile_AssignsCategoryId()
    {
        var cat = new Lumia3DCore.Models.Category { Name = "Mecânica" };
        _env.Repository.AddCategory(cat);

        string src = WriteTempStl("porca.stl");
        var obj = _env.Library.ImportFile(src, categoryId: cat.Id);
        obj!.CategoryId.Should().Be(cat.Id);
    }

    [Fact]
    public void ImportFile_DuplicateHash_ReturnsExistingObject()
    {
        string src = WriteTempStl("modelo.stl");
        var first  = _env.Library.ImportFile(src);
        var second = _env.Library.ImportFile(src);

        first.Should().NotBeNull();
        second!.Id.Should().Be(first!.Id);
        _env.Repository.GetAllObjects().Should().HaveCount(1);
    }

    [Fact]
    public void ImportFile_CopiesFileToLibraryDirectory()
    {
        string src = WriteTempStl("cubo.stl");
        var obj = _env.Library.ImportFile(src);
        File.Exists(obj!.MainFilePath).Should().BeTrue();
        obj.MainFilePath.Should().StartWith(_env.LibraryPath);
    }

    // ── DeleteObject ──────────────────────────────────────────────────────────

    [Fact]
    public void DeleteObject_RemovesFromDb()
    {
        string src = WriteTempStl("temp.stl");
        var obj = _env.Library.ImportFile(src)!;
        _env.Library.DeleteObject(obj);
        _env.Repository.GetObject(obj.Id).Should().BeNull();
    }

    [Fact]
    public void DeleteObject_DeletesMainFileFromDisk()
    {
        string src = WriteTempStl("temp2.stl");
        var obj = _env.Library.ImportFile(src)!;
        string mainFilePath = obj.MainFilePath;

        _env.Library.DeleteObject(obj);
        File.Exists(mainFilePath).Should().BeFalse();
    }

    // ── ImportAttachment ──────────────────────────────────────────────────────

    [Fact]
    public void ImportAttachment_NonExistentFile_ReturnsNull()
    {
        string src = WriteTempStl("base.stl");
        var obj = _env.Library.ImportFile(src)!;
        _env.Library.ImportAttachment(obj.Id, Path.Combine(_env.LibraryPath, "ghost.pdf")).Should().BeNull();
    }

    [Fact]
    public void ImportAttachment_ValidFile_CreatesRecord()
    {
        string src = WriteTempStl("base2.stl");
        var obj = _env.Library.ImportFile(src)!;

        string attSrc = WriteTempFile("doc.pdf", "PDF content"u8.ToArray());
        var att = _env.Library.ImportAttachment(obj.Id, attSrc);

        att.Should().NotBeNull();
        att!.ObjectId.Should().Be(obj.Id);
        File.Exists(att.FilePath).Should().BeTrue();
    }

    // ── ImportFolder ──────────────────────────────────────────────────────────

    [Fact]
    public void ImportFolder_ImportsAllStlFiles()
    {
        string folder = Path.Combine(_env.LibraryPath, "pasta");
        Directory.CreateDirectory(folder);
        File.WriteAllBytes(Path.Combine(folder, "a.stl"), TestFiles.BinaryStl());
        File.WriteAllBytes(Path.Combine(folder, "b.stl"), TestFiles.BinaryStl());

        var (objectsImported, _, _) = _env.Library.ImportFolder(folder, null);
        objectsImported.Should().Be(2);
    }

    [Fact]
    public void ImportFolder_CreatesCategoryForFolder()
    {
        string folder = Path.Combine(_env.LibraryPath, "engrenagens");
        Directory.CreateDirectory(folder);
        File.WriteAllBytes(Path.Combine(folder, "pinhao.stl"), TestFiles.BinaryStl());

        _env.Library.ImportFolder(folder, null);

        _env.Repository.GetAllCategories()
            .Should().ContainSingle(c => c.Name == "Engrenagens");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string WriteTempStl(string name)
    {
        string path = Path.Combine(Path.GetTempPath(), name);
        File.WriteAllBytes(path, TestFiles.BinaryStl());
        return path;
    }

    private string WriteTempFile(string name, byte[] content)
    {
        string path = Path.Combine(Path.GetTempPath(), name);
        File.WriteAllBytes(path, content);
        return path;
    }
}
