using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Lumia3DCore.Data;
using Lumia3DCore.Models;
using Lumia3DCore.Services;

namespace Lumia3DCore.Ipc;

/// <summary>
/// Roteador de ações IPC entre o frontend React e os serviços C#.
/// Suporta respostas síncronas (return value) e eventos assíncronos (SetPushAction).
/// </summary>
public class IpcBridge
{
    private readonly ObjectRepository _repository;
    private readonly LibraryManager _library;

    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private Action<string>? _push;
    private CancellationTokenSource? _importCts;

    public IpcBridge(ObjectRepository repository, LibraryManager library)
    {
        _repository = repository;
        _library = library;
    }

    /// <summary>Registra o delegate que envia mensagens push ao frontend (PhotinoWindow.SendWebMessage).</summary>
    public void SetPushAction(Action<string> push) => _push = push;

    /// <summary>Envia um evento push ao frontend sem request correspondente.</summary>
    public void Push(object payload) => _push?.Invoke(JsonSerializer.Serialize(payload, _json));

    public string Handle(string messageJson)
    {
        try
        {
            var request = JsonSerializer.Deserialize<IpcRequest>(messageJson, _json);
            if (request == null)
                return Serialize(IpcResponse.Fail("Invalid message"));

            var response = request.Action switch
            {
                "getAppInfo"          => HandleGetAppInfo(),
                "getObjects"          => HandleGetObjects(request),
                "searchObjects"       => HandleSearchObjects(request),
                "getCategories"       => HandleGetCategories(),
                "getTags"             => HandleGetTags(),
                "getAttachments"      => HandleGetAttachments(request),

                "importFile"          => HandleImportFile(request),
                "importFolder"        => HandleImportFolder(request),
                "cancelImport"        => HandleCancelImport(),

                "deleteObject"        => HandleDeleteObject(request),
                "updateObject"        => HandleUpdateObject(request),

                "addTagToObject"      => HandleAddTagToObject(request),
                "removeTagFromObject" => HandleRemoveTagFromObject(request),
                "createTag"           => HandleCreateTag(request),
                "updateTag"           => HandleUpdateTag(request),
                "deleteTag"           => HandleDeleteTag(request),

                "createCategory"      => HandleCreateCategory(request),
                "updateCategory"      => HandleUpdateCategory(request),
                "deleteCategory"      => HandleDeleteCategory(request),

                "addAttachment"       => HandleAddAttachment(request),
                "deleteAttachment"    => HandleDeleteAttachment(request),

                "regenerateThumbnail" => HandleRegenerateThumbnail(request),

                "getSettings"         => HandleGetSettings(),
                "saveSettings"        => HandleSaveSettings(request),

                _ => IpcResponse.Fail($"Unknown action: {request.Action}")
            };

            return Serialize(response);
        }
        catch (Exception ex)
        {
            AppLogger.Error("IpcBridge.Handle falhou", ex);
            return Serialize(IpcResponse.Fail(ex.Message));
        }
    }

    // ── Leitura ──────────────────────────────────────────────────────────────

    private static IpcResponse HandleGetAppInfo() => IpcResponse.Ok(new
    {
        version      = VersionInfo.Current,
        shortVersion = VersionInfo.Short,
        buildDate    = VersionInfo.BuildDate,
        commit       = VersionInfo.Commit,
        repoUrl      = "https://github.com/LumiaLabsBR/Lumia3D-Core"
    });

    private IpcResponse HandleGetObjects(IpcRequest req)
    {
        int? categoryId = req.Payload.TryGetProperty("categoryId", out var cProp) && cProp.ValueKind != JsonValueKind.Null
            ? cProp.GetInt32() : null;
        int? tagId = req.Payload.TryGetProperty("tagId", out var tProp) && tProp.ValueKind != JsonValueKind.Null
            ? tProp.GetInt32() : null;
        return IpcResponse.Ok(_repository.GetAllObjects(categoryId, tagId));
    }

    private IpcResponse HandleSearchObjects(IpcRequest req)
    {
        string term = req.Payload.TryGetProperty("term", out var tProp) ? tProp.GetString() ?? "" : "";
        int? categoryId = req.Payload.TryGetProperty("categoryId", out var cProp) && cProp.ValueKind != JsonValueKind.Null
            ? cProp.GetInt32() : null;
        int? tagId = req.Payload.TryGetProperty("tagId", out var tagProp) && tagProp.ValueKind != JsonValueKind.Null
            ? tagProp.GetInt32() : null;
        return IpcResponse.Ok(_repository.SearchObjects(term, categoryId, tagId));
    }

    private IpcResponse HandleGetCategories()   => IpcResponse.Ok(_repository.GetAllCategories());
    private IpcResponse HandleGetTags()         => IpcResponse.Ok(_repository.GetAllTags());

    private IpcResponse HandleGetAttachments(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("objectId", out var idProp))
            return IpcResponse.Fail("objectId required");
        return IpcResponse.Ok(_repository.GetAttachments(idProp.GetInt32()));
    }

    // ── Import ───────────────────────────────────────────────────────────────

    private IpcResponse HandleImportFile(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("filePath", out var fpProp))
            return IpcResponse.Fail("filePath required");

        string filePath = fpProp.GetString() ?? "";
        if (!File.Exists(filePath))
            return IpcResponse.Fail("Arquivo não encontrado");

        if (!LibraryManager.Object3DExtensions.Contains(Path.GetExtension(filePath)))
            return IpcResponse.Fail($"Extensão não suportada: {Path.GetExtension(filePath)}");

        int? categoryId = req.Payload.TryGetProperty("categoryId", out var cProp) && cProp.ValueKind != JsonValueKind.Null
            ? cProp.GetInt32() : null;

        var obj = _library.ImportFile(filePath, categoryId);
        if (obj == null)
            return IpcResponse.Fail("Falha ao importar arquivo (verifique os logs)");

        return IpcResponse.Ok(new { obj });
    }

    private IpcResponse HandleImportFolder(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("folderPath", out var fpProp))
            return IpcResponse.Fail("folderPath required");

        string folderPath = fpProp.GetString() ?? "";
        if (!Directory.Exists(folderPath))
            return IpcResponse.Fail("Pasta não encontrada");

        int? parentCategoryId = req.Payload.TryGetProperty("parentCategoryId", out var cProp) && cProp.ValueKind != JsonValueKind.Null
            ? cProp.GetInt32() : null;

        _importCts?.Cancel();
        _importCts = new CancellationTokenSource();
        var ct = _importCts.Token;

        Task.Run(() =>
        {
            try
            {
                var (objs, atts, categoryId) = _library.ImportFolder(
                    folderPath, parentCategoryId,
                    onProgress: fileName  => Push(new { @event = "importProgress", fileName }),
                    onCounts:   (o, a)    => Push(new { @event = "importCounts", objectsImported = o, attachmentsImported = a }),
                    cancellationToken: ct);

                Push(new { @event = "importComplete", objectsImported = objs, attachmentsImported = atts, categoryId });
            }
            catch (OperationCanceledException)
            {
                Push(new { @event = "importCanceled" });
            }
            catch (Exception ex)
            {
                AppLogger.Error("ImportFolder falhou", ex);
                Push(new { @event = "importError", message = ex.Message });
            }
        }, CancellationToken.None);

        return IpcResponse.Ok(new { started = true });
    }

    private IpcResponse HandleCancelImport()
    {
        _importCts?.Cancel();
        return IpcResponse.Ok(null);
    }

    // ── Objetos ──────────────────────────────────────────────────────────────

    private IpcResponse HandleDeleteObject(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("id", out var idProp))
            return IpcResponse.Fail("id required");

        var obj = _repository.GetObject(idProp.GetInt32());
        if (obj == null)
            return IpcResponse.Fail("Objeto não encontrado");

        _library.DeleteObject(obj);
        return IpcResponse.Ok(null);
    }

    private IpcResponse HandleUpdateObject(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("id", out var idProp))
            return IpcResponse.Fail("id required");

        int id = idProp.GetInt32();
        var obj = _repository.GetObject(id);
        if (obj == null)
            return IpcResponse.Fail("Objeto não encontrado");

        if (req.Payload.TryGetProperty("name", out var nProp) && nProp.ValueKind == JsonValueKind.String)
            obj.Name = nProp.GetString()!;
        if (req.Payload.TryGetProperty("description", out var dProp))
            obj.Description = dProp.ValueKind == JsonValueKind.String ? dProp.GetString() ?? "" : "";

        _repository.UpdateObject(obj);

        if (req.Payload.TryGetProperty("categoryId", out var cProp))
        {
            int? newCategoryId = cProp.ValueKind == JsonValueKind.Null ? null : cProp.GetInt32();
            _repository.UpdateObjectCategory(id, newCategoryId);
        }

        return IpcResponse.Ok(null);
    }

    // ── Tags ─────────────────────────────────────────────────────────────────

    private IpcResponse HandleAddTagToObject(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("objectId", out var oProp) ||
            !req.Payload.TryGetProperty("tagId", out var tProp))
            return IpcResponse.Fail("objectId e tagId required");

        _repository.AddTagToObject(oProp.GetInt32(), tProp.GetInt32());
        return IpcResponse.Ok(null);
    }

    private IpcResponse HandleRemoveTagFromObject(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("objectId", out var oProp) ||
            !req.Payload.TryGetProperty("tagId", out var tProp))
            return IpcResponse.Fail("objectId e tagId required");

        _repository.RemoveTagFromObject(oProp.GetInt32(), tProp.GetInt32());
        return IpcResponse.Ok(null);
    }

    private IpcResponse HandleCreateTag(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("name", out var nProp))
            return IpcResponse.Fail("name required");

        string name = nProp.GetString() ?? "";
        if (string.IsNullOrWhiteSpace(name))
            return IpcResponse.Fail("name não pode ser vazio");

        string? color = req.Payload.TryGetProperty("color", out var cProp) && cProp.ValueKind == JsonValueKind.String
            ? cProp.GetString() : null;

        var tag = _repository.AddOrGetTag(name, color);
        return IpcResponse.Ok(tag);
    }

    private IpcResponse HandleUpdateTag(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("tagId", out var idProp))
            return IpcResponse.Fail("tagId required");

        string? color = req.Payload.TryGetProperty("color", out var cProp)
            ? (cProp.ValueKind == JsonValueKind.String ? cProp.GetString() : null)
            : default(string?);

        if (req.Payload.TryGetProperty("color", out _))
            _repository.UpdateTagColor(idProp.GetInt32(), color);

        return IpcResponse.Ok(null);
    }

    private IpcResponse HandleDeleteTag(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("tagId", out var idProp))
            return IpcResponse.Fail("tagId required");

        _repository.DeleteTag(idProp.GetInt32());
        return IpcResponse.Ok(null);
    }

    // ── Categorias ───────────────────────────────────────────────────────────

    private IpcResponse HandleCreateCategory(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("name", out var nProp))
            return IpcResponse.Fail("name required");

        string name = nProp.GetString() ?? "";
        if (string.IsNullOrWhiteSpace(name))
            return IpcResponse.Fail("name não pode ser vazio");

        int? parentId = req.Payload.TryGetProperty("parentCategoryId", out var pProp) && pProp.ValueKind != JsonValueKind.Null
            ? pProp.GetInt32() : null;

        var category = new Category { Name = name, ParentCategoryId = parentId };
        _repository.AddCategory(category);
        return IpcResponse.Ok(category);
    }

    private IpcResponse HandleUpdateCategory(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("id", out var idProp))
            return IpcResponse.Fail("id required");
        if (!req.Payload.TryGetProperty("name", out var nProp))
            return IpcResponse.Fail("name required");

        string name = nProp.GetString() ?? "";
        if (string.IsNullOrWhiteSpace(name))
            return IpcResponse.Fail("name não pode ser vazio");

        int? parentId = req.Payload.TryGetProperty("parentCategoryId", out var pProp) && pProp.ValueKind != JsonValueKind.Null
            ? pProp.GetInt32() : null;
        int sortOrder = req.Payload.TryGetProperty("sortOrder", out var sProp) ? sProp.GetInt32() : 0;

        var category = new Category { Id = idProp.GetInt32(), Name = name, ParentCategoryId = parentId, SortOrder = sortOrder };
        _repository.UpdateCategory(category);
        return IpcResponse.Ok(null);
    }

    private IpcResponse HandleDeleteCategory(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("id", out var idProp))
            return IpcResponse.Fail("id required");

        _repository.DeleteCategory(idProp.GetInt32());
        return IpcResponse.Ok(null);
    }

    // ── Anexos ───────────────────────────────────────────────────────────────

    private IpcResponse HandleAddAttachment(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("objectId", out var oProp) ||
            !req.Payload.TryGetProperty("filePath", out var fpProp))
            return IpcResponse.Fail("objectId e filePath required");

        string filePath = fpProp.GetString() ?? "";
        if (!File.Exists(filePath))
            return IpcResponse.Fail("Arquivo não encontrado");

        var att = _library.ImportAttachment(oProp.GetInt32(), filePath);
        if (att == null)
            return IpcResponse.Fail("Falha ao importar anexo");

        return IpcResponse.Ok(att);
    }

    private IpcResponse HandleDeleteAttachment(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("id", out var idProp))
            return IpcResponse.Fail("id required");

        var att = _repository.GetAttachment(idProp.GetInt32());
        if (att == null)
            return IpcResponse.Fail("Anexo não encontrado");

        _library.DeleteAttachment(att);
        return IpcResponse.Ok(null);
    }

    // ── Thumbnail ─────────────────────────────────────────────────────────────

    private IpcResponse HandleRegenerateThumbnail(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("objectId", out var idProp))
            return IpcResponse.Fail("objectId required");

        var obj = _repository.GetObject(idProp.GetInt32());
        if (obj == null)
            return IpcResponse.Fail("Objeto não encontrado");

        _library.RegenerateThumbnail(obj);
        return IpcResponse.Ok(new { queued = true });
    }

    // ── Configurações ─────────────────────────────────────────────────────────

    private static IpcResponse HandleGetSettings()
    {
        var s = UserSettings.Load();
        return IpcResponse.Ok(new
        {
            theme              = s.Theme,
            density            = s.Density,
            viewMode           = s.ViewMode,
            sortOrder          = s.SortOrder,
            sidebarWidth       = s.SidebarWidth,
            autoCheckUpdates   = s.AutoCheckUpdates,
            includePreReleases = s.IncludePreReleases,
            lastRepositoryPath = s.LastRepositoryPath,
            recentRepositories = s.RecentRepositories,
            thumbnailWorkerCount = s.ThumbnailWorkerCount,
        });
    }

    private static IpcResponse HandleSaveSettings(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("settings", out var sProp))
            return IpcResponse.Fail("settings required");

        var s = UserSettings.Load();

        if (sProp.TryGetProperty("theme",              out var v) && v.ValueKind == JsonValueKind.String) s.Theme              = v.GetString()!;
        if (sProp.TryGetProperty("density",            out v)     && v.ValueKind == JsonValueKind.String) s.Density            = v.GetString()!;
        if (sProp.TryGetProperty("viewMode",           out v)     && v.ValueKind == JsonValueKind.String) s.ViewMode           = v.GetString()!;
        if (sProp.TryGetProperty("sortOrder",          out v)     && v.ValueKind == JsonValueKind.String) s.SortOrder          = v.GetString()!;
        if (sProp.TryGetProperty("sidebarWidth",       out v)     && v.ValueKind == JsonValueKind.Number) s.SidebarWidth       = v.GetDouble();
        if (sProp.TryGetProperty("autoCheckUpdates",   out v)     && v.ValueKind == JsonValueKind.True  || v.ValueKind == JsonValueKind.False) s.AutoCheckUpdates = v.GetBoolean();
        if (sProp.TryGetProperty("includePreReleases", out v)     && v.ValueKind == JsonValueKind.True  || v.ValueKind == JsonValueKind.False) s.IncludePreReleases = v.GetBoolean();

        s.Save();
        return IpcResponse.Ok(null);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private static string Serialize(IpcResponse response)
        => JsonSerializer.Serialize(response, _json);
}
