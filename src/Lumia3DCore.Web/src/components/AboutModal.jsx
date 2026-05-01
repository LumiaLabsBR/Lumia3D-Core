import { Lumia3DLogo, LumiaLabsSignature } from './Logo.jsx';

/**
 * Modal "Sobre o Lumia3D Core" — exibe versão, build date, commit e créditos.
 */
export function AboutModal({ appInfo, onClose }) {
  if (!appInfo) return null;

  const backdrop = {
    position: 'fixed', inset: 0, zIndex: 90,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const card = {
    width: 360, background: '#13141a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
    animation: 'slideUp 180ms ease-out',
  };

  const row = (label, value, href) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: '#7A8290', fontSize: 12 }}>{label}</span>
      {href
        ? <a href={href} target="_blank" rel="noreferrer" style={{ color: '#FF7A1A', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', textDecoration: 'none' }}>{value}</a>
        : <span style={{ color: '#E6E8EC', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>{value}</span>
      }
    </div>
  );

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', background: '#0f1015' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Lumia3DLogo size={1.2} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#E6E8EC', letterSpacing: '-0.3px' }}>Lumia3D Core</div>
          <div style={{ fontSize: 11, color: '#5A626C', marginTop: 3, fontFamily: '"JetBrains Mono", monospace' }}>
            {`v${appInfo.version}`}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '16px 24px' }}>
          {row('Versão', `v${appInfo.shortVersion}`)}
          {row('Build', appInfo.buildDate)}
          {row('Commit', appInfo.commit === 'local' ? 'build local' : appInfo.commit,
            appInfo.commit !== 'local' && appInfo.commit !== 'dev'
              ? `${appInfo.repoUrl}/commit/${appInfo.commit}`
              : null)}
          {row('Repositório', 'LumiaLabsBR/Lumia3D-Core', appInfo.repoUrl)}
          {row('Licença', 'MIT — fork de jalf/stlhub')}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{ fontSize: 11, color: '#5A626C' }}>Feito por</div>
          <LumiaLabsSignature />
          <div style={{ fontSize: 10, color: '#3A4048', marginTop: 4, textAlign: 'center', lineHeight: 1.5 }}>
            100% local · zero telemetria · zero cloud
          </div>
        </div>

        {/* Close */}
        <div style={{ padding: '0 24px 20px' }}>
          <button onClick={onClose} style={{
            width: '100%', height: 32,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 6, color: '#9097A0',
            fontSize: 12, cursor: 'pointer',
            transition: 'background 120ms',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
