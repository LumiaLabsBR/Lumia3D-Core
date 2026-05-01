using FluentAssertions;
using Lumia3DCore.Models;
using Lumia3DCore.Tests.Helpers;

namespace Lumia3DCore.Tests.Data;

public class ObjectRepositoryTests : IDisposable
{
    private readonly TempLibrary _env = new();

    public void Dispose() => _env.Dispose();

    // ── Object3D ──────────────────────────────────────────────────────────────

    [Fact]
    public void AddObject_SetsAutoIncrementId()
    {
        var obj = MakeObject("Cube");
        _env.Repository.AddObject(obj);
        obj.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public void GetAllObjects_ReturnsAllAdded()
    {
        _env.Repository.AddObject(MakeObject("Cube"));
        _env.Repository.AddObject(MakeObject("Sphere"));
        _env.Repository.GetAllObjects().Should().HaveCount(2);
    }

    [Fact]
    public void GetAllObjects_FiltersByCategory()
    {
        var cat = new Category { Name = "Mecânica" };
        _env.Repository.AddCategory(cat);

        _env.Repository.AddObject(MakeObject("Porca", categoryId: cat.Id));
        _env.Repository.AddObject(MakeObject("Parafuso", categoryId: cat.Id));
        _env.Repository.AddObject(MakeObject("Vaso"));

        _env.Repository.GetAllObjects(categoryId: cat.Id).Should().HaveCount(2);
    }

    [Fact]
    public void GetObject_ById_ReturnsCorrectObject()
    {
        var obj = MakeObject("Roda");
        _env.Repository.AddObject(obj);

        var found = _env.Repository.GetObject(obj.Id);
        found.Should().NotBeNull();
        found!.Name.Should().Be("Roda");
    }

    [Fact]
    public void GetObject_UnknownId_ReturnsNull()
        => _env.Repository.GetObject(9999).Should().BeNull();

    [Fact]
    public void GetObjectByHash_ReturnsMatchingObject()
    {
        var obj = MakeObject("Engrenagem", hash: "abc123");
        _env.Repository.AddObject(obj);

        _env.Repository.GetObjectByHash("abc123").Should().NotBeNull();
        _env.Repository.GetObjectByHash("other").Should().BeNull();
    }

    [Fact]
    public void UpdateObject_ChangesNameAndDescription()
    {
        var obj = MakeObject("Antigo");
        _env.Repository.AddObject(obj);

        obj.Name = "Novo";
        obj.Description = "desc atualizada";
        _env.Repository.UpdateObject(obj);

        _env.Repository.GetObject(obj.Id)!.Name.Should().Be("Novo");
    }

    [Fact]
    public void DeleteObject_RemovesFromDb()
    {
        var obj = MakeObject("Temporário");
        _env.Repository.AddObject(obj);
        _env.Repository.DeleteObject(obj.Id);
        _env.Repository.GetObject(obj.Id).Should().BeNull();
    }

    [Fact]
    public void GetStats_ReturnsCountAndTotalSize()
    {
        // Cria 2 arquivos reais e referencia em Object3D para que GetStats some os tamanhos.
        string p1 = Path.Combine(_env.LibraryPath, "a.stl");
        string p2 = Path.Combine(_env.LibraryPath, "b.stl");
        File.WriteAllBytes(p1, new byte[1024]);
        File.WriteAllBytes(p2, new byte[2048]);

        var o1 = MakeObject("A"); o1.MainFilePath = p1; _env.Repository.AddObject(o1);
        var o2 = MakeObject("B"); o2.MainFilePath = p2; _env.Repository.AddObject(o2);

        var (count, totalBytes) = _env.Repository.GetStats();
        count.Should().Be(2);
        totalBytes.Should().Be(3072);
    }

    [Fact]
    public void ForeignKeyConstraint_RejectsInvalidObjectIdInAttachment()
    {
        // Confirma que PRAGMA foreign_keys=ON está ativo na conexão.
        // Sem esse pragma, o SQLite aceitaria silenciosamente o ObjectId fantasma.
        var att = new Lumia3DCore.Models.Attachment
        {
            ObjectId = 999999,  // não existe
            FilePath = Path.Combine(_env.LibraryPath, "ghost.pdf"),
            Type     = ".pdf",
        };

        Action act = () => _env.Repository.AddAttachment(att);
        act.Should().Throw<Microsoft.Data.Sqlite.SqliteException>()
           .Which.Message.Should().Contain("FOREIGN KEY");
    }

    [Fact]
    public void UpdateObjectThumbnail_UpdatesPath()
    {
        var obj = MakeObject("Cubo");
        _env.Repository.AddObject(obj);

        string thumbPath = Path.Combine(_env.LibraryPath, "Thumbnails", "thumb.png");
        _env.Repository.UpdateObjectThumbnail(obj.Id, thumbPath);

        _env.Repository.GetObject(obj.Id)!.ThumbnailPath.Should().Be(thumbPath);
    }

    // ── FTS search ────────────────────────────────────────────────────────────

    [Fact]
    public void SearchObjects_FindsByName()
    {
        _env.Repository.AddObject(MakeObject("Iron Man Helmet"));
        _env.Repository.AddObject(MakeObject("Base Plate"));

        var results = _env.Repository.SearchObjects("iron");
        results.Should().ContainSingle(o => o.Name == "Iron Man Helmet");
    }

    [Fact]
    public void SearchObjects_EmptyTerm_ReturnsAll()
    {
        _env.Repository.AddObject(MakeObject("A"));
        _env.Repository.AddObject(MakeObject("B"));

        _env.Repository.SearchObjects("").Should().HaveCount(2);
    }

    // ── Tags ──────────────────────────────────────────────────────────────────

    [Fact]
    public void AddOrGetTag_IdempotentForSameName()
    {
        var t1 = _env.Repository.AddOrGetTag("flexível");
        var t2 = _env.Repository.AddOrGetTag("flexível");
        t1.Id.Should().Be(t2.Id);
    }

    [Fact]
    public void AddOrGetTag_NormalizesToLowerCase()
    {
        var t1 = _env.Repository.AddOrGetTag("Metal");
        var t2 = _env.Repository.AddOrGetTag("metal");
        t1.Id.Should().Be(t2.Id);
    }

    [Fact]
    public void AddTagToObject_AppearInGetTags()
    {
        var obj = MakeObject("Cubo");
        _env.Repository.AddObject(obj);
        var tag = _env.Repository.AddOrGetTag("azul");

        _env.Repository.AddTagToObject(obj.Id, tag.Id);
        var tags = _env.Repository.GetTagsForObject(obj.Id);
        tags.Should().ContainSingle(t => t.Name == "azul");
    }

    [Fact]
    public void RemoveTagFromObject_RemovesIt()
    {
        var obj = MakeObject("Cubo");
        _env.Repository.AddObject(obj);
        var tag = _env.Repository.AddOrGetTag("vermelho");

        _env.Repository.AddTagToObject(obj.Id, tag.Id);
        _env.Repository.RemoveTagFromObject(obj.Id, tag.Id);
        _env.Repository.GetTagsForObject(obj.Id).Should().BeEmpty();
    }

    [Fact]
    public void DeleteTag_RemovesTagAndObjectTagRows()
    {
        var obj = MakeObject("X");
        _env.Repository.AddObject(obj);
        var tag = _env.Repository.AddOrGetTag("descartável");
        _env.Repository.AddTagToObject(obj.Id, tag.Id);

        _env.Repository.DeleteTag(tag.Id);

        _env.Repository.GetAllTags().Should().NotContain(t => t.Name == "descartável");
        _env.Repository.GetTagsForObject(obj.Id).Should().BeEmpty();
    }

    // ── Categories ────────────────────────────────────────────────────────────

    [Fact]
    public void AddCategory_SetsId()
    {
        var cat = new Category { Name = "Organico" };
        _env.Repository.AddCategory(cat);
        cat.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public void DeleteCategory_NullifiesObjectCategoryId()
    {
        var cat = new Category { Name = "Temporária" };
        _env.Repository.AddCategory(cat);
        var obj = MakeObject("Filho", categoryId: cat.Id);
        _env.Repository.AddObject(obj);

        _env.Repository.DeleteCategory(cat.Id);

        _env.Repository.GetObject(obj.Id)!.CategoryId.Should().BeNull();
    }

    // ── Attachments ───────────────────────────────────────────────────────────

    [Fact]
    public void AddAttachment_CanBeRetrievedById()
    {
        var obj = MakeObject("Base");
        _env.Repository.AddObject(obj);

        string attPath = Path.Combine(_env.LibraryPath, "Attachments", "file.pdf");
        var att = new Lumia3DCore.Models.Attachment
        {
            ObjectId = obj.Id,
            FilePath = attPath,
            Type     = ".pdf"
        };
        _env.Repository.AddAttachment(att);

        var found = _env.Repository.GetAttachment(att.Id);
        found.Should().NotBeNull();
        found!.ObjectId.Should().Be(obj.Id);
    }

    [Fact]
    public void CountAttachmentsByFilePath_ReturnsCorrectCount()
    {
        var o1 = MakeObject("A"); _env.Repository.AddObject(o1);
        var o2 = MakeObject("B"); _env.Repository.AddObject(o2);

        string sharedPath = Path.Combine(_env.LibraryPath, "Attachments", "shared.pdf");
        _env.Repository.AddAttachment(new() { ObjectId = o1.Id, FilePath = sharedPath, Type = ".pdf" });
        _env.Repository.AddAttachment(new() { ObjectId = o2.Id, FilePath = sharedPath, Type = ".pdf" });

        _env.Repository.CountAttachmentsByFilePath(sharedPath).Should().Be(2);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Object3D MakeObject(string name, int? categoryId = null, string hash = "")
        => new()
        {
            Name          = name,
            MainFilePath  = Path.Combine(_env.LibraryPath, $"{name}.stl"),
            FileType      = ".stl",
            ThumbnailPath = "",
            Hash          = string.IsNullOrEmpty(hash) ? Guid.NewGuid().ToString("N") : hash,
            CategoryId    = categoryId,
            CreatedAt     = DateTime.UtcNow,
        };
}
