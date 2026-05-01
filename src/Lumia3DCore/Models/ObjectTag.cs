namespace Lumia3DCore.Models;

/// <summary>
/// Tabela de junção da relação muitos-para-muitos entre Object3D e Tag.
/// </summary>
public class ObjectTag
{
    public int ObjectId { get; set; }
    public int TagId { get; set; }
}
