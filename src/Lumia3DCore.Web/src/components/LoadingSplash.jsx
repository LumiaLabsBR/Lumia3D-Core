import { Lumia3DLogo } from './Logo.jsx';

/**
 * Overlay exibido enquanto a app Photino inicializa (antes do primeiro IPC).
 * Desaparece com fade-out ao receber prop visible=false.
 */
export function LoadingSplash({ visible }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: '#0a0b0e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      pointerEvents: visible ? 'all' : 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 300ms ease-out',
    }}>
      <Lumia3DLogo size={2} />

      {/* Spinner */}
      <div style={{ position: 'relative', width: 28, height: 28 }}>
        <svg
          width={28} height={28}
          viewBox="0 0 28 28"
          style={{ animation: 'spin 900ms linear infinite' }}
        >
          <circle
            cx={14} cy={14} r={11}
            fill="none"
            stroke="rgba(255,122,26,0.15)"
            strokeWidth={2}
          />
          <path
            d="M 14 3 A 11 11 0 0 1 25 14"
            fill="none"
            stroke="#FF7A1A"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, color: '#3A4048', letterSpacing: '0.05em',
      }}>
        iniciando…
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
