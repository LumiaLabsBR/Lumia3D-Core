using System;
using System.Text.Json;
using Lumia3DCore.Data;
using Lumia3DCore.Services;

namespace Lumia3DCore.Ipc;

/// <summary>
/// Roteador de ações IPC entre o frontend React e os serviços C#.
/// Cada action mapeada aqui corresponde a uma chamada em src/Lumia3DCore.Web/src/api/client.js.
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

    public IpcBridge(ObjectRepository repository, LibraryManager library)
    {
        _repository = repository;
        _library = library;
    }

    public string Handle(string messageJson)
    {
        try
        {
            var request = JsonSerializer.Deserialize<IpcRequest>(messageJson, _json);
            if (request == null)
                return Serialize(IpcResponse.Fail("Invalid message"));

            var response = request.Action switch
            {
                "getAppInfo"     => HandleGetAppInfo(),
                "getObjects"     => HandleGetObjects(request),
                "searchObjects"  => HandleSearchObjects(request),
                "getCategories"  => HandleGetCategories(),
                "getTags"        => HandleGetTags(),
                "getAttachments" => HandleGetAttachments(request),

                // Fases 2-7: handlers de mutação (import, delete, update, etc.)
                // TODO: "importFile"         => HandleImportFile(request),
                // TODO: "importFolder"       => HandleImportFolder(request),
                // TODO: "deleteObject"       => HandleDeleteObject(request),
                // TODO: "updateObject"       => HandleUpdateObject(request),
                // TODO: "addTagToObject"     => HandleAddTagToObject(request),
                // TODO: "removeTagFromObject"=> HandleRemoveTagFromObject(request),
                // TODO: "createCategory"     => HandleCreateCategory(request),
                // TODO: "deleteCategory"     => HandleDeleteCategory(request),
                // TODO: "addAttachment"      => HandleAddAttachment(request),
                // TODO: "deleteAttachment"   => HandleDeleteAttachment(request),
                // TODO: "regenerateThumbnail"=> HandleRegenerateThumbnail(request),
                // TODO: "getSettings"        => HandleGetSettings(),
                // TODO: "saveSettings"       => HandleSaveSettings(request),
                // TODO: "checkForUpdate"     => HandleCheckForUpdate(),

                _ => IpcResponse.Fail($"Unknown action: {request.Action}")
            };

            return Serialize(response);
        }
        catch (Exception ex)
        {
            return Serialize(IpcResponse.Fail(ex.Message));
        }
    }

    private static IpcResponse HandleGetAppInfo() => IpcResponse.Ok(new
    {
        version   = VersionInfo.Current,
        shortVersion = VersionInfo.Short,
        buildDate = VersionInfo.BuildDate,
        commit    = VersionInfo.Commit,
        repoUrl   = "https://github.com/LumiaLabsBR/Lumia3D-Core"
    });

    private IpcResponse HandleGetObjects(IpcRequest req)
    {
        int? categoryId = req.Payload.TryGetProperty("categoryId", out var cProp) && cProp.ValueKind != JsonValueKind.Null
            ? cProp.GetInt32() : null;
        int? tagId = req.Payload.TryGetProperty("tagId", out var tProp) && tProp.ValueKind != JsonValueKind.Null
            ? tProp.GetInt32() : null;

        var objects = _repository.GetAllObjects(categoryId, tagId);
        return IpcResponse.Ok(objects);
    }

    private IpcResponse HandleSearchObjects(IpcRequest req)
    {
        string term = req.Payload.TryGetProperty("term", out var tProp) ? tProp.GetString() ?? "" : "";
        int? categoryId = req.Payload.TryGetProperty("categoryId", out var cProp) && cProp.ValueKind != JsonValueKind.Null
            ? cProp.GetInt32() : null;
        int? tagId = req.Payload.TryGetProperty("tagId", out var tagProp) && tagProp.ValueKind != JsonValueKind.Null
            ? tagProp.GetInt32() : null;

        var results = _repository.SearchObjects(term, categoryId, tagId);
        return IpcResponse.Ok(results);
    }

    private IpcResponse HandleGetCategories()
        => IpcResponse.Ok(_repository.GetAllCategories());

    private IpcResponse HandleGetTags()
        => IpcResponse.Ok(_repository.GetAllTags());

    private IpcResponse HandleGetAttachments(IpcRequest req)
    {
        if (!req.Payload.TryGetProperty("objectId", out var idProp))
            return IpcResponse.Fail("objectId required");
        var attachments = _repository.GetAttachments(idProp.GetInt32());
        return IpcResponse.Ok(attachments);
    }

    private static string Serialize(IpcResponse response)
        => JsonSerializer.Serialize(response, _json);
}
