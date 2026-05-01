using System;

namespace Lumia3DCore.Models;

/// <summary>
/// Representa um objeto 3D na biblioteca, incluindo metadados e caminhos de arquivo.
/// </summary>
public class Object3D
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string MainFilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string ThumbnailPath { get; set; } = string.Empty;
    public string Hash { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Metadados extraídos do arquivo no import (migration 003)
    public long   FileSize      { get; set; }
    public int    TriangleCount { get; set; }
    public double Width         { get; set; }
    public double Height        { get; set; }
    public double Depth         { get; set; }

    // Campos auxiliares (não persistidos)
    public string? CategoryName { get; set; }
    public string RelativeFilePath { get; set; } = string.Empty;
    public string[] Tags { get; set; } = Array.Empty<string>();
}
