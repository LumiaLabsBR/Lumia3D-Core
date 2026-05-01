namespace Lumia3DCore.Models;

/// <summary>
/// Anexo (imagem, PDF, G-code, instruções, etc.) vinculado a um objeto 3D.
/// </summary>
public class Attachment
{
    public int Id { get; set; }
    public int ObjectId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}
