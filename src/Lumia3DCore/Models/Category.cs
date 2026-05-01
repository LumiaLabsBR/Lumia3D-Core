namespace Lumia3DCore.Models;

/// <summary>
/// Categoria/pasta para organizar objetos 3D em uma árvore hierárquica.
/// </summary>
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }
    public int SortOrder { get; set; }
}
