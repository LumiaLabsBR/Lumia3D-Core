import { Lumia3DLogo } from './Logo.jsx';
import { Icon } from './Icons.jsx';

/**
 * Modal "Atualização disponível" — exibido em resposta ao push event
 * `updateAvailable` do backend (UpdateChecker → IpcBridge).
 *
 * Props:
 *   info    — { version, tagName, installerUrl, sha256Url, installerSize, releaseNotes }
 *   onDownload — invoca ipc.downloadUpdate(...) (pai cuida do progresso)
 *   onLater    — fecha o modal sem ação
 */
export function UpdateModal({ info, downloadProgress, onDownload, onLater, onCancelDownload }) {
  if (!info) return null;
  const sizeMB = info.installerSize > 0 ? (info.installerSize / 1048576).toFixed(1) : '?';
  const downloading = downloadProgress != null;

  return (
    <div onClick={downloading ? undefined : onLater} style={{
      position: 'fixed', inset: 0, zIndex: 95,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 460, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        background: '#13141a', border: '1px solid rgba(255, 122, 26, 0.25)',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255, 122, 26, 0.08)',
        animation: 'slideUp 180ms ease-out',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', textAlign: 'center', background: '#0f1015', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <Lumia3DLogo size={1} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: '#FF7A1A' }}>
            Atualização disponível
          </div>
          <div style={{ marginTop: 6, fontSize: 16, color: '#E6E8EC' }}>
            Lumia3D Core <span style={{ color: '#FFA85F', fontFamily: '"JetBrains Mono", monospace' }}>{info.tagName || 'v' + info.version}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: '#5A626C', fontFamily: '"JetBrains Mono", monospace' }}>
            instalador {sizeMB} MB
          </div>
        </div>

        {/* Release notes */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', minHeight: 80 }}>
          {info.releaseNotes ? (
            <pre style={{
              margin: 0, fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11, color: '#9097A0', lineHeight: 1.55,
              whiteSpace: 'pre-wrap', wordWrap: 'break-word',
            }}>{info.releaseNotes}</pre>
          ) : (
            <div style={{ fontSize: 12, color: '#5A626C', textAlign: 'center', padding: '20px 0' }}>
              Sem notas de release.
            </div>
          )}
        </div>

        {/* Progress bar (durante download) */}
        {downloading && (
          <div style={{ padding: '8px 24px 12px', background: '#0a0b0e', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9097A0', marginBottom: 6, fontFamily: '"JetBrains Mono", monospace' }}>
              <span>baixando…</span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #FF8A2E, #FFA85F)', transition: 'width 80ms linear' }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', gap: 8,
        }}>
          {downloading ? (
            <>
              <button onClick={onCancelDownload} style={{
                flex: 1, height: 36, borderRadius: 5,
                background: 'rgba(232, 17, 35, 0.12)',
                border: '1px solid rgba(232, 17, 35, 0.30)',
                color: '#FF8888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancelar
              </button>
              <button disabled style={{
                flex: 2, height: 36, borderRadius: 5,
                background: 'rgba(255, 122, 26, 0.2)',
                border: '1px solid rgba(255, 138, 46, 0.3)',
                color: '#FFA85F', fontWeight: 600,
                fontSize: 12, cursor: 'default', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Icon name="download" size={13} strokeWidth={2.2} />
                Baixando…
              </button>
            </>
          ) : (
            <>
              <button onClick={onLater} style={{
                flex: 1, height: 36, borderRadius: 5,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#9097A0',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Mais tarde
              </button>
              <button onClick={onDownload} style={{
                flex: 2, height: 36, borderRadius: 5,
                background: 'linear-gradient(180deg, #FF8A2E 0%, #E66A0F 100%)',
                border: '1px solid rgba(255, 138, 46, 0.3)',
                color: '#1a0f05', fontWeight: 600,
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset',
              }}>
                <Icon name="download" size={13} strokeWidth={2.2} />
                Baixar e instalar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
