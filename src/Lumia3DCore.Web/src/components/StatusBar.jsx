/**
 * Barra de status fixa na base da janela.
 * Esquerda: contagem da biblioteca.
 * Direita: versão clicável → abre modal About.
 */
export function StatusBar({ modelCount, appInfo, onAbout }) {
  return (
    <div style={{
      height: 24, flexShrink: 0,
      background: '#09090c',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 8,
      fontSize: 11, color: '#5A626C',
      userSelect: 'none',
    }}>
      {/* Lado esquerdo — status da biblioteca */}
      <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        {modelCount != null ? `${modelCount} modelos` : '…'}
      </span>

      <div style={{ flex: 1 }} />

      {/* Lado direito — versão (clicável) */}
      <button
        onClick={onAbout}
        title="Sobre o Lumia3D Core"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 6px', height: 18, borderRadius: 3,
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5,
          color: '#5A626C', display: 'flex', alignItems: 'center', gap: 4,
          transition: 'color 120ms, background 120ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#FF7A1A'; e.currentTarget.style.background = 'rgba(255,122,26,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#5A626C'; e.currentTarget.style.background = 'none'; }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#FF7A1A', display: 'inline-block', flexShrink: 0,
        }} />
        {appInfo ? `v${appInfo.shortVersion}` : 'v…'}
      </button>
    </div>
  );
}
