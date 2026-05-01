using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using Lumia3DCore.Data;
using Lumia3DCore.Models;

namespace Lumia3DCore.Services;

/// <summary>
/// Serviço central da biblioteca 3D. Gerencia importação de arquivos e pastas,
/// anexos, deleção de objetos e regeneração de thumbnails.
/// </summary>
public class LibraryManager
{
    private readonly string _libraryPath;
    private readonly ObjectRepository _repository;
    private readonly string _thumbnailsPath;

    public static readonly HashSet<string> Object3DExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".stl", ".3mf", ".obj", ".step", ".stp" };

    public LibraryManager(string libraryPath, ObjectRepository repository)
    {
        _libraryPath = libraryPath;
        _repository = repository;
        _thumbnailsPath = Path.Combine(libraryPath, "Thumbnails");

        Directory.CreateDirectory(_libraryPath);
        Directory.CreateDirectory(_thumbnailsPath);
    }

    public Object3D? ImportFile(string sourceFilePath, int? categoryId = null)
    {
        if (!File.Exists(sourceFilePath)) return null;

        var fileInfo = new FileInfo(sourceFilePath);
        string hash = CalculateHash(sourceFilePath);

        var existing = _repository.GetObjectByHash(hash);
        if (existing != null) return existing;

        string destinationFileName = $"{hash}{fileInfo.Extension}";
        string destinationFilePath = Path.Combine(_libraryPath, destinationFileName);

        if (!File.Exists(destinationFilePath))
            File.Copy(sourceFilePath, destinationFilePath);

        string thumbnailPath = ThumbnailGenerator.GenerateThumbnail(destinationFilePath, _thumbnailsPath);

        var newObject = new Object3D
        {
            Name = SanitizeName(Path.GetFileNameWithoutExtension(fileInfo.Name)),
            MainFilePath = destinationFilePath,
            FileType = fileInfo.Extension.ToLower(),
            ThumbnailPath = thumbnailPath,
            Hash = hash,
            CategoryId = categoryId,
            CreatedAt = DateTime.UtcNow
        };

        _repository.AddObject(newObject);
        return newObject;
    }

    /// <summary>
    /// Importa uma pasta recursivamente: subpastas viram categorias,
    /// arquivos 3D viram objetos, outros arquivos viram anexos dos objetos 3D da mesma pasta.
    /// </summary>
    public (int objectsImported, int attachmentsImported, int? createdCategoryId) ImportFolder(
        string folderPath,
        int? parentCategoryId,
        Action<string>? onProgress = null,
        Action<int, int>? onCounts = null,
        CancellationToken cancellationToken = default)
    {
        int objectsImported = 0;
        int attachmentsImported = 0;
        int? firstCreatedCategoryId = null;

        ImportFolderRecursive(folderPath, parentCategoryId, onProgress, onCounts,
            ref objectsImported, ref attachmentsImported, ref firstCreatedCategoryId, cancellationToken);

        return (objectsImported, attachmentsImported, firstCreatedCategoryId);
    }

    private void ImportFolderRecursive(
        string folderPath,
        int? parentCategoryId,
        Action<string>? onProgress,
        Action<int, int>? onCounts,
        ref int objectsImported,
        ref int attachmentsImported,
        ref int? firstCreatedCategoryId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var allFiles = Directory.GetFiles(folderPath);
        var object3DFiles = new List<string>(allFiles.Length);
        var otherFiles = new List<string>(allFiles.Length);
        foreach (var f in allFiles)
            (Object3DExtensions.Contains(Path.GetExtension(f)) ? object3DFiles : otherFiles).Add(f);

        int? categoryId = null;
        if (object3DFiles.Count > 0)
        {
            string folderName = Path.GetFileName(folderPath);
            var category = new Category
            {
                Name = SanitizeName(folderName),
                ParentCategoryId = parentCategoryId
            };
            _repository.AddCategory(category);
            categoryId = category.Id;
            firstCreatedCategoryId ??= category.Id;

            var importedObjects = new List<Object3D>();
            foreach (var file in object3DFiles)
            {
                cancellationToken.ThrowIfCancellationRequested();
                onProgress?.Invoke(Path.GetFileName(file));
                var obj = ImportFile(file, categoryId);
                if (obj != null)
                {
                    importedObjects.Add(obj);
                    objectsImported++;
                    onCounts?.Invoke(objectsImported, attachmentsImported);
                }
            }

            if (importedObjects.Count > 0 && otherFiles.Count > 0)
            {
                foreach (var file in otherFiles)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    onProgress?.Invoke(Path.GetFileName(file));
                    foreach (var obj in importedObjects)
                        ImportAttachment(obj.Id, file);
                    attachmentsImported++;
                    onCounts?.Invoke(objectsImported, attachmentsImported);
                }
            }
        }

        foreach (var subDir in Directory.GetDirectories(folderPath))
        {
            ImportFolderRecursive(subDir, categoryId ?? parentCategoryId, onProgress, onCounts,
                ref objectsImported, ref attachmentsImported, ref firstCreatedCategoryId, cancellationToken);
        }
    }

    public Attachment? ImportAttachment(int objectId, string sourceFilePath)
    {
        if (!File.Exists(sourceFilePath)) return null;

        var attachmentsDir = Path.Combine(_libraryPath, "Attachments");
        Directory.CreateDirectory(attachmentsDir);

        var fileInfo = new FileInfo(sourceFilePath);
        string hash = CalculateHash(sourceFilePath);
        string destinationFileName = $"{hash}{fileInfo.Extension}";
        string destinationFilePath = Path.Combine(attachmentsDir, destinationFileName);

        if (!File.Exists(destinationFilePath))
            File.Copy(sourceFilePath, destinationFilePath);

        var newAttachment = new Attachment
        {
            ObjectId = objectId,
            FilePath = destinationFilePath,
            Type = fileInfo.Extension.ToLower()
        };

        _repository.AddAttachment(newAttachment);
        return newAttachment;
    }

    public void DeleteAttachment(Attachment attachment)
    {
        _repository.DeleteAttachment(attachment.Id);

        if (_repository.CountAttachmentsByFilePath(attachment.FilePath) == 0)
        {
            try { if (File.Exists(attachment.FilePath)) File.Delete(attachment.FilePath); }
            catch { /* não-fatal */ }
        }
    }

    public void DeleteObject(Object3D obj)
    {
        var attachments = _repository.GetAttachments(obj.Id).ToList();
        _repository.DeleteObject(obj.Id);

        foreach (var att in attachments)
        {
            if (_repository.CountAttachmentsByFilePath(att.FilePath) == 0)
            {
                try { if (File.Exists(att.FilePath)) File.Delete(att.FilePath); } catch { }
            }
        }

        try { if (File.Exists(obj.ThumbnailPath)) File.Delete(obj.ThumbnailPath); } catch { }
        try { if (File.Exists(obj.MainFilePath)) File.Delete(obj.MainFilePath); } catch { }
    }

    public string RegenerateThumbnail(Object3D obj)
    {
        try { if (File.Exists(obj.ThumbnailPath)) File.Delete(obj.ThumbnailPath); } catch { }
        string newPath = ThumbnailGenerator.GenerateThumbnail(obj.MainFilePath, _thumbnailsPath);
        _repository.UpdateObjectThumbnail(obj.Id, newPath);
        return newPath;
    }

    private string CalculateHash(string filePath)
    {
        using var sha256 = SHA256.Create();
        using var stream = File.OpenRead(filePath);
        var hashBytes = sha256.ComputeHash(stream);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }

    private static string SanitizeName(string name)
    {
        name = Regex.Replace(name, @"[_\-\.]+", " ");
        name = Regex.Replace(name, @"(?<=[a-z])(?=[A-Z])", " ");
        name = Regex.Replace(name, @"\s{2,}", " ").Trim();
        if (name.Length > 0)
            name = Regex.Replace(name, @"\b(\w)", m => m.Value.ToUpper());
        return name;
    }
}
