namespace Lumia3DCore.Models;

/// <summary>
/// Etiqueta definida pelo usuário, associável a múltiplos objetos 3D.
/// </summary>
public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
}
