namespace Lumia3DCore.Ipc;

/// <summary>
/// Resposta serializada para JSON e devolvida ao frontend via PhotinoWindow.SendWebMessage().
/// </summary>
public class IpcResponse
{
    public bool Success { get; set; }
    public object? Data { get; set; }
    public string? Error { get; set; }

    public static IpcResponse Ok(object? data = null) => new() { Success = true, Data = data };
    public static IpcResponse Fail(string error) => new() { Success = false, Error = error };
}
