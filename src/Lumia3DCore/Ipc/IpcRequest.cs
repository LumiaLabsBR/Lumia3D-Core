using System.Text.Json;

namespace Lumia3DCore.Ipc;

/// <summary>
/// Mensagem enviada pelo frontend React via window.external.sendMessage().
/// </summary>
public class IpcRequest
{
    public string Action { get; set; } = string.Empty;
    public JsonElement Payload { get; set; }
}
