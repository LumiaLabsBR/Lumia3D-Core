using FluentAssertions;
using Lumia3DCore.Services;
using Lumia3DCore.Tests.Helpers;

namespace Lumia3DCore.Tests.Services;

public class MetadataExtractorTests : IDisposable
{
    private readonly string _tmpDir = Path.Combine(Path.GetTempPath(), $"metatest_{Guid.NewGuid():N}");

    public MetadataExtractorTests() => Directory.CreateDirectory(_tmpDir);
    public void Dispose() => Directory.Delete(_tmpDir, recursive: true);

    [Fact]
    public void ExtractStl_Binary_Returns1Triangle_AndUnitBoundingBox()
    {
        // BinaryStl em TestFiles cria 1 triângulo com vertices (0,0,0), (1,0,0), (0,1,0).
        string path = Path.Combine(_tmpDir, "tri.stl");
        File.WriteAllBytes(path, TestFiles.BinaryStl());

        var meta = MetadataExtractor.Extract(path);
        meta.TriangleCount.Should().Be(1);
        meta.Width .Should().BeApproximately(1, 1e-5);
        meta.Height.Should().BeApproximately(1, 1e-5);
        meta.Depth .Should().Be(0);
    }

    [Fact]
    public void ExtractStl_Ascii_CountsFacets()
    {
        string path = Path.Combine(_tmpDir, "tri.stl");
        File.WriteAllText(path, TestFiles.AsciiStl());

        var meta = MetadataExtractor.Extract(path);
        meta.TriangleCount.Should().Be(1);
    }

    [Fact]
    public void ExtractObj_TriangulatesQuadAsTwoTris()
    {
        string path = Path.Combine(_tmpDir, "quad.obj");
        File.WriteAllText(path, TestFiles.ObjWithQuad());

        var meta = MetadataExtractor.Extract(path);
        meta.TriangleCount.Should().Be(2); // 1 quad = 2 tris (fan)
        meta.Width.Should().BeApproximately(1, 1e-5);
        meta.Height.Should().BeApproximately(1, 1e-5);
    }

    [Fact]
    public void Extract_NonExistentFile_ReturnsEmpty()
    {
        var meta = MetadataExtractor.Extract(Path.Combine(_tmpDir, "ghost.stl"));
        meta.Should().Be(MetadataExtractor.Empty);
    }

    [Fact]
    public void Extract_UnknownExtension_ReturnsEmpty()
    {
        string path = Path.Combine(_tmpDir, "x.xyz");
        File.WriteAllText(path, "lorem ipsum");
        var meta = MetadataExtractor.Extract(path);
        meta.Should().Be(MetadataExtractor.Empty);
    }
}
