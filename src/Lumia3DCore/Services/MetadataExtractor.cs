using System;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;

namespace Lumia3DCore.Services;

/// <summary>
/// Extrai metadados (triangulos + bounding box) de arquivos 3D durante o import.
/// Cada parser é leve e read-once: lê o arquivo apenas para metadata, sem
/// carregar a malha completa em memória (exceto OBJ que precisa dos vértices).
/// </summary>
public static class MetadataExtractor
{
    public record Metadata(int TriangleCount, double Width, double Height, double Depth);

    public static readonly Metadata Empty = new(0, 0, 0, 0);

    public static Metadata Extract(string filePath)
    {
        try
        {
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            return ext switch
            {
                ".stl" => ExtractStl(filePath),
                ".obj" => ExtractObj(filePath),
                ".3mf" => Extract3mf(filePath),
                _      => Empty
            };
        }
        catch (Exception ex)
        {
            AppLogger.Warn($"MetadataExtractor falhou em '{Path.GetFileName(filePath)}': {ex.Message}");
            return Empty;
        }
    }

    // ── STL ──────────────────────────────────────────────────────────────────

    private static Metadata ExtractStl(string filePath)
    {
        var info = new FileInfo(filePath);
        if (info.Length < 84) return Empty;

        // STL binário: header(80) + uint32 count + 50*count bytes
        // STL ASCII: começa com "solid" mas binário também pode — checar tamanho.
        using var stream = File.OpenRead(filePath);
        Span<byte> header = stackalloc byte[84];
        if (stream.Read(header) < 84) return Empty;

        uint count = BitConverter.ToUInt32(header.Slice(80, 4));
        long expectedBinSize = 84 + (long)count * 50;
        bool isBinary = count > 0 && expectedBinSize == info.Length;

        return isBinary ? ExtractStlBinary(stream, count) : ExtractStlAscii(filePath);
    }

    private static Metadata ExtractStlBinary(Stream stream, uint count)
    {
        // Stream já está no offset 84. Cada triângulo: 12*4 floats + 2 byte attr = 50 bytes
        // Ler todas as posições só dos 3 vertices (12 floats = 48 bytes), pular 2.
        const int triSize = 50;
        const int safetyLimit = 5_000_000; // mesmo limite do ThumbnailGenerator
        int n = (int)Math.Min(count, safetyLimit);

        double minX = double.PositiveInfinity, minY = double.PositiveInfinity, minZ = double.PositiveInfinity;
        double maxX = double.NegativeInfinity, maxY = double.NegativeInfinity, maxZ = double.NegativeInfinity;

        var buf = new byte[triSize];
        for (int i = 0; i < n; i++)
        {
            int read = stream.Read(buf, 0, triSize);
            if (read < triSize) break;
            // Skip normal (12 bytes), depois 3 vertices (12 bytes cada)
            for (int v = 0; v < 3; v++)
            {
                int off = 12 + v * 12;
                float x = BitConverter.ToSingle(buf, off);
                float y = BitConverter.ToSingle(buf, off + 4);
                float z = BitConverter.ToSingle(buf, off + 8);
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
                if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
            }
        }

        return n == 0
            ? new Metadata((int)count, 0, 0, 0)
            : new Metadata((int)count, maxX - minX, maxY - minY, maxZ - minZ);
    }

    private static Metadata ExtractStlAscii(string filePath)
    {
        int facets = 0;
        double minX = double.PositiveInfinity, minY = double.PositiveInfinity, minZ = double.PositiveInfinity;
        double maxX = double.NegativeInfinity, maxY = double.NegativeInfinity, maxZ = double.NegativeInfinity;

        using var reader = new StreamReader(filePath);
        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            var trimmed = line.TrimStart();
            if (trimmed.StartsWith("facet ", StringComparison.Ordinal))
            {
                facets++;
            }
            else if (trimmed.StartsWith("vertex ", StringComparison.Ordinal))
            {
                var parts = trimmed.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 4 &&
                    double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var x) &&
                    double.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var y) &&
                    double.TryParse(parts[3], NumberStyles.Float, CultureInfo.InvariantCulture, out var z))
                {
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
                }
            }
        }

        return facets == 0
            ? Empty
            : new Metadata(facets, maxX - minX, maxY - minY, maxZ - minZ);
    }

    // ── OBJ ──────────────────────────────────────────────────────────────────

    private static Metadata ExtractObj(string filePath)
    {
        // OBJ: contar 'f ' linhas (cada quad conta como 2 triangulos via fan).
        // Bbox: iterar 'v ' linhas.
        double minX = double.PositiveInfinity, minY = double.PositiveInfinity, minZ = double.PositiveInfinity;
        double maxX = double.NegativeInfinity, maxY = double.NegativeInfinity, maxZ = double.NegativeInfinity;
        int triangles = 0;

        using var reader = new StreamReader(filePath);
        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            if (line.Length < 2) continue;
            if (line.StartsWith("v ", StringComparison.Ordinal))
            {
                var parts = line.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 4 &&
                    double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var x) &&
                    double.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var y) &&
                    double.TryParse(parts[3], NumberStyles.Float, CultureInfo.InvariantCulture, out var z))
                {
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
                }
            }
            else if (line.StartsWith("f ", StringComparison.Ordinal))
            {
                // Fan triangulation: N vertices → (N-2) triangulos
                int verts = line.Count(c => c == ' ');
                if (verts >= 3) triangles += verts - 2;
            }
        }

        return triangles == 0
            ? Empty
            : new Metadata(triangles, maxX - minX, maxY - minY, maxZ - minZ);
    }

    // ── 3MF (ZIP com /3D/3dmodel.model XML) ──────────────────────────────────

    private static Metadata Extract3mf(string filePath)
    {
        using var zip = ZipFile.OpenRead(filePath);
        var entry = zip.Entries.FirstOrDefault(e =>
            e.FullName.EndsWith("3dmodel.model", StringComparison.OrdinalIgnoreCase));
        if (entry == null) return Empty;

        // Cap defensivo (zip bomb / arquivo corrompido)
        const long maxXmlBytes = 100 * 1024 * 1024;
        if (entry.Length > maxXmlBytes) return Empty;

        using var stream = entry.Open();
        using var reader = new StreamReader(stream, Encoding.UTF8);
        string xml = reader.ReadToEnd();

        // Parser ingênuo via substring — evita custo de XmlReader pra metadata simples.
        // Conta <triangle ...> tags.
        int triangles = CountSubstring(xml, "<triangle ");

        // Bbox: extrair vertices via regex simples
        double minX = double.PositiveInfinity, minY = double.PositiveInfinity, minZ = double.PositiveInfinity;
        double maxX = double.NegativeInfinity, maxY = double.NegativeInfinity, maxZ = double.NegativeInfinity;
        int idx = 0;
        while ((idx = xml.IndexOf("<vertex ", idx, StringComparison.Ordinal)) >= 0)
        {
            int end = xml.IndexOf("/>", idx, StringComparison.Ordinal);
            if (end < 0) break;
            string tag = xml.Substring(idx, end - idx);
            double? x = ExtractAttr(tag, "x"), y = ExtractAttr(tag, "y"), z = ExtractAttr(tag, "z");
            if (x.HasValue && y.HasValue && z.HasValue)
            {
                if (x < minX) minX = x.Value; if (x > maxX) maxX = x.Value;
                if (y < minY) minY = y.Value; if (y > maxY) maxY = y.Value;
                if (z < minZ) minZ = z.Value; if (z > maxZ) maxZ = z.Value;
            }
            idx = end + 2;
        }

        return triangles == 0 || double.IsInfinity(minX)
            ? new Metadata(triangles, 0, 0, 0)
            : new Metadata(triangles, maxX - minX, maxY - minY, maxZ - minZ);
    }

    private static int CountSubstring(string text, string substring)
    {
        int count = 0, idx = 0;
        while ((idx = text.IndexOf(substring, idx, StringComparison.Ordinal)) >= 0)
        {
            count++; idx += substring.Length;
        }
        return count;
    }

    private static double? ExtractAttr(string tag, string attr)
    {
        string needle = attr + "=\"";
        int start = tag.IndexOf(needle, StringComparison.Ordinal);
        if (start < 0) return null;
        start += needle.Length;
        int end = tag.IndexOf('"', start);
        if (end < 0) return null;
        return double.TryParse(tag.AsSpan(start, end - start),
            NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : null;
    }
}
