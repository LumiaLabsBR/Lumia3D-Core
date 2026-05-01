// Lumia3D Core — Mark + Wordmark logo
// Mark: isometric stacked cube assembled from facets (cataloged 3D parts metaphor)
// Wordmark: weighted display + monospaced "Core" suffix

export const Lumia3DLogo = ({ size = 1, color = '#E6E8EC', accent = '#FF7A1A' }) => {
  const s = size;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 * s }}>
      {/* Mark — isometric cube, exploded into vertex/facet hint */}
      <svg width={40 * s} height={40 * s} viewBox="0 0 40 40" fill="none" style={{ display: 'block' }}>
        <g opacity="0.35" stroke={color} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" fill="none">
          <path d="M20 4.2 L34.2 12 L34.2 28 L20 35.8 L5.8 28 L5.8 12 Z" />
          <path d="M20 4.2 L20 19.8" />
          <path d="M5.8 12 L20 19.8 L34.2 12" />
          <path d="M20 19.8 L20 35.8" />
        </g>
        <path d="M20 8 L31.6 14.4 L31.6 25.6 L20 32 L20 19.8 Z" fill={color} fillOpacity="0.9" />
        <path d="M20 8 L20 19.8 L8.4 14.4 Z" fill={color} fillOpacity="0.55" />
        <path d="M8.4 14.4 L20 19.8 L20 32 L8.4 25.6 Z" fill={color} fillOpacity="0.25" />
        <circle cx="20" cy="19.8" r="1.6" fill={accent} />
        <circle cx="20" cy="19.8" r="3.6" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.8" />
      </svg>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * s, fontFeatureSettings: '"ss01"' }}>
        <span
          style={{
            fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
            fontSize: 22 * s,
            fontWeight: 600,
            letterSpacing: -0.5,
            color: color,
            lineHeight: 1,
          }}
        >
          Lumia<span style={{ color: accent }}>3D</span>
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 13 * s,
            fontWeight: 500,
            letterSpacing: 0.5,
            color: color,
            opacity: 0.7,
            textTransform: 'lowercase',
          }}
        >
          /core
        </span>
      </div>
    </div>
  );
};

// LumiaLabs developer signature — mono tech style
export const LumiaLabsSignature = ({ color = '#7A8290' }) => (
  <div
    style={{
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 10,
      fontWeight: 400,
      letterSpacing: 1.4,
      color,
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <span style={{ opacity: 0.55 }}>by</span>
    <span>
      Lumia<span style={{ opacity: 0.6 }}> Labs</span>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 11,
          background: color,
          marginLeft: 3,
          verticalAlign: 'middle',
          animation: 'lumiaCursor 1.1s steps(2) infinite',
        }}
      />
    </span>
  </div>
);
