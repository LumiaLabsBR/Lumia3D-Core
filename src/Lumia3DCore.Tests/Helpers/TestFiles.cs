namespace Lumia3DCore.Tests.Helpers;

/// <summary>Gera conteúdo binário de arquivos 3D mínimos válidos para testes.</summary>
public static class TestFiles
{
    /// <summary>STL binário com 1 triângulo válido (134 bytes exatos).</summary>
    public static byte[] BinaryStl(int triangles = 1)
    {
        var bytes = new byte[84 + triangles * 50];
        // Header: 80 zeros (já zero por default do array)
        // Triangle count
        BitConverter.GetBytes((uint)triangles).CopyTo(bytes, 80);

        for (int t = 0; t < triangles; t++)
        {
            int o = 84 + t * 50;
            // Normal (0, 0, 1)
            BitConverter.GetBytes(0.0f).CopyTo(bytes, o);
            BitConverter.GetBytes(0.0f).CopyTo(bytes, o + 4);
            BitConverter.GetBytes(1.0f).CopyTo(bytes, o + 8);
            // V0 (0, 0, 0) — zeros
            // V1 (1, 0, 0)
            BitConverter.GetBytes(1.0f).CopyTo(bytes, o + 12);
            BitConverter.GetBytes(0.0f).CopyTo(bytes, o + 16);
            BitConverter.GetBytes(0.0f).CopyTo(bytes, o + 20);
            // V2 (0, 1, 0)
            BitConverter.GetBytes(0.0f).CopyTo(bytes, o + 24);
            BitConverter.GetBytes(1.0f).CopyTo(bytes, o + 28);
            BitConverter.GetBytes(0.0f).CopyTo(bytes, o + 32);
            // Attribute: 2 zeros
        }
        return bytes;
    }

    public static string AsciiStl() => """
        solid test
          facet normal 0 0 1
            outer loop
              vertex 0 0 0
              vertex 1 0 0
              vertex 0 1 0
            endloop
          endfacet
        endsolid test
        """;

    public static string Obj() => """
        # Triângulo mínimo
        v 0 0 0
        v 1 0 0
        v 0 1 0
        vn 0 0 1
        f 1//1 2//1 3//1
        """;

    public static string ObjWithQuad() => """
        v 0 0 0
        v 1 0 0
        v 1 1 0
        v 0 1 0
        f 1 2 3 4
        """;

    public static string ObjWithNegativeIndices() => """
        v 0 0 0
        v 1 0 0
        v 0 1 0
        f -3 -2 -1
        """;

    /// <summary>Cria um arquivo .3mf (ZIP) com uma entrada PNG segura.</summary>
    public static string Create3mfWithValidPng(string dir)
    {
        var path = Path.Combine(dir, "model.3mf");
        using var zip = System.IO.Compression.ZipFile.Open(path, System.IO.Compression.ZipArchiveMode.Create);
        var entry = zip.CreateEntry("Metadata/thumbnail.png");
        using var stream = entry.Open();
        // PNG mínimo 1×1 pixel (bytes fixos)
        var pngBytes = MinimalPng();
        stream.Write(pngBytes);
        return path;
    }

    /// <summary>Cria um .3mf com entrada de path traversal (../../evil.png).</summary>
    public static string Create3mfWithTraversalEntry(string dir)
    {
        var path = Path.Combine(dir, "evil.3mf");
        using var zip = System.IO.Compression.ZipFile.Open(path, System.IO.Compression.ZipArchiveMode.Create);
        var entry = zip.CreateEntry("../../evil.png");
        using var stream = entry.Open();
        stream.Write(MinimalPng());
        return path;
    }

    private static byte[] MinimalPng()
    {
        // PNG signature + IHDR + IDAT + IEND (1×1 red pixel)
        return Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==");
    }
}
