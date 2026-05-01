using System;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Lumia3DCore.Data;

namespace Lumia3DCore.Services;

public record ThumbnailJob(int ObjectId, string ModelFilePath);

/// <summary>
/// Fila assíncrona de geração de thumbnails. Um único worker processa os jobs
/// em background para não bloquear a UI durante imports em massa.
/// </summary>
public sealed class ThumbnailQueue : IDisposable
{
    private readonly Channel<ThumbnailJob> _channel;
    private readonly ObjectRepository _repository;
    private readonly string _thumbnailsDir;
    private readonly CancellationTokenSource _cts = new();
    private readonly Task _worker;

    /// <summary>Chamado no thread do worker após cada thumbnail gerado com sucesso.</summary>
    public Action<int, string>? OnThumbnailReady { get; set; }

    public ThumbnailQueue(ObjectRepository repository, string thumbnailsDir)
    {
        _repository = repository;
        _thumbnailsDir = thumbnailsDir;
        _channel = Channel.CreateBounded<ThumbnailJob>(new BoundedChannelOptions(500)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false,
        });
        _worker = Task.Run(() => RunAsync(_cts.Token));
    }

    public void Enqueue(ThumbnailJob job) => _channel.Writer.TryWrite(job);

    private async Task RunAsync(CancellationToken ct)
    {
        await foreach (var job in _channel.Reader.ReadAllAsync(ct).ConfigureAwait(false))
        {
            try
            {
                string path = ThumbnailGenerator.GenerateThumbnail(job.ModelFilePath, _thumbnailsDir);
                if (!string.IsNullOrEmpty(path))
                {
                    _repository.UpdateObjectThumbnail(job.ObjectId, path);
                    OnThumbnailReady?.Invoke(job.ObjectId, path);
                }
            }
            catch (Exception ex)
            {
                AppLogger.Warn($"ThumbnailQueue: objectId={job.ObjectId} — {ex.Message}");
            }
        }
    }

    public void Dispose()
    {
        _channel.Writer.TryComplete();
        _cts.Cancel();
        try { _worker.Wait(TimeSpan.FromSeconds(3)); } catch { }
        _cts.Dispose();
    }
}
