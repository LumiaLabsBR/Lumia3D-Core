using FluentAssertions;
using Lumia3DCore.Services;
using Lumia3DCore.Tests.Helpers;

namespace Lumia3DCore.Tests.Services;

public class ThumbnailGeneratorTests : IDisposable
{
    private readonly string _tmpDir = Path.Combine(Path.GetTempPath(), $"thumbtest_{Guid.NewGuid():N}");

    public ThumbnailGeneratorTests() => Directory.CreateDirectory(_tmpDir);
    public void Dispose() => Directory.Delete(_tmpDir, recursive: true);

    // ── STL ───────────────────────────────────────────────────────────────────

    [Fact]
    public void GenerateThumbnail_BinaryStl_ReturnsPngPath()
    {
        string stl = WriteFile("cube.stl", TestFiles.BinaryStl());
        string result = ThumbnailGenerator.GenerateThumbnail(stl, _tmpDir);
        result.Should().EndWith(".png");
        File.Exists(result).Should().BeTrue();
    }

    [Fact]
    public void GenerateThumbnail_AsciiStl_ReturnsPngPath()
    {
        string stl = WriteFile("ascii.stl", System.Text.Encoding.UTF8.GetBytes(TestFiles.AsciiStl()));
        string result = ThumbnailGenerator.GenerateThumbnail(stl, _tmpDir);
        result.Should().EndWith(".png");
        File.Exists(result).Should().BeTrue();
    }

    [Fact]
    public void GenerateThumbnail_StlCalledTwice_UsesCachedFile()
    {
        string stl = WriteFile("cached.stl", TestFiles.BinaryStl());
        string first  = ThumbnailGenerator.GenerateThumbnail(stl, _tmpDir);
        string second = ThumbnailGenerator.GenerateThumbnail(stl, _tmpDir);
        first.Should().Be(second);
    }

    // ── OBJ ───────────────────────────────────────────────────────────────────

    [Fact]
    public void GenerateThumbnail_Obj_ReturnsPngPath()
    {
        string obj = WriteFile("tri.obj", System.Text.Encoding.UTF8.GetBytes(TestFiles.Obj()));
        string result = ThumbnailGenerator.GenerateThumbnail(obj, _tmpDir);
        result.Should().EndWith(".png");
        File.Exists(result).Should().BeTrue();
    }

    [Fact]
    public void GenerateThumbnail_ObjWithQuad_ReturnsPngPath()
    {
        string obj = WriteFile("quad.obj", System.Text.Encoding.UTF8.GetBytes(TestFiles.ObjWithQuad()));
        string result = ThumbnailGenerator.GenerateThumbnail(obj, _tmpDir);
        File.Exists(result).Should().BeTrue();
    }

    [Fact]
    public void GenerateThumbnail_ObjWithNegativeIndices_ReturnsPngPath()
    {
        string obj = WriteFile("neg.obj", System.Text.Encoding.UTF8.GetBytes(TestFiles.ObjWithNegativeIndices()));
        string result = ThumbnailGenerator.GenerateThumbnail(obj, _tmpDir);
        File.Exists(result).Should().BeTrue();
    }

    // ── 3MF ──────────────────────────────────────────────────────────────────

    [Fact]
    public void GenerateThumbnail_3mfWithValidPng_ExtractsPng()
    {
        string mfPath = TestFiles.Create3mfWithValidPng(_tmpDir);
        string result = ThumbnailGenerator.GenerateThumbnail(mfPath, _tmpDir);
        result.Should().EndWith(".png");
        File.Exists(result).Should().BeTrue();
    }

    [Fact]
    public void GenerateThumbnail_3mfWithTraversalEntry_DoesNotEscapeDir()
    {
        string mfPath = TestFiles.Create3mfWithTraversalEntry(_tmpDir);
        string result = ThumbnailGenerator.GenerateThumbnail(mfPath, _tmpDir);
        // Result can be either a fallback thumbnail or empty, but must not write outside _tmpDir
        if (!string.IsNullOrEmpty(result))
            result.Should().StartWith(_tmpDir);
        string evilPath = Path.Combine(Path.GetTempPath(), "evil.png");
        File.Exists(evilPath).Should().BeFalse();
    }

    // ── Fallback ──────────────────────────────────────────────────────────────

    [Fact]
    public void GenerateThumbnail_NonExistentFile_ReturnsFallbackOrEmpty()
    {
        string result = ThumbnailGenerator.GenerateThumbnail(
            Path.Combine(_tmpDir, "ghost.stl"), _tmpDir);
        result.Should().BeEmpty();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string WriteFile(string name, byte[] content)
    {
        string path = Path.Combine(_tmpDir, name);
        File.WriteAllBytes(path, content);
        return path;
    }
}
