// Procedural SVG "renders" for model thumbnails — neutral clay/grey, soft shadow

const ClayDefs = ({ id }) => (
  <defs>
    <radialGradient id={`floor-${id}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
      <stop offset="60%" stopColor="#000" stopOpacity="0.15" />
      <stop offset="100%" stopColor="#000" stopOpacity="0" />
    </radialGradient>
    <linearGradient id={`light-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#F4F5F7" />
      <stop offset="100%" stopColor="#9097A0" />
    </linearGradient>
    <linearGradient id={`side-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#C4C8CE" />
      <stop offset="100%" stopColor="#6B727B" />
    </linearGradient>
    <linearGradient id={`dark-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#7A8089" />
      <stop offset="100%" stopColor="#3F4550" />
    </linearGradient>
    <linearGradient id={`metal-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#E8EBEF" />
      <stop offset="40%" stopColor="#A8AEB6" />
      <stop offset="100%" stopColor="#5A626C" />
    </linearGradient>
  </defs>
);

const Floor = ({ id, cx = 100, cy = 165, rx = 70, ry = 10 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#floor-${id})`} />
);

const shapes = {
  gear: (id) => (<>
    <Floor id={id} rx={60} ry={9} />
    <g transform="translate(100 95)">
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const x = Math.cos(a) * 60, y = Math.sin(a) * 22;
        return <rect key={i} x={x - 6} y={y - 4} width="12" height="8" fill={`url(#side-${id})`} transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`} />;
      })}
      <ellipse rx="55" ry="20" fill={`url(#light-${id})`} />
      <ellipse rx="55" ry="20" fill="none" stroke="#3F4550" strokeOpacity="0.3" />
      <ellipse rx="14" ry="5" fill={`url(#dark-${id})`} />
    </g>
  </>),
  bracket: (id) => (<>
    <Floor id={id} rx={75} ry={10} />
    <g transform="translate(100 100)">
      <path d="M-60 25 L60 25 L70 35 L-50 35 Z" fill={`url(#side-${id})`} />
      <rect x="-60" y="-10" width="120" height="35" fill={`url(#light-${id})`} />
      <path d="M-15 -55 L15 -55 L25 -45 L-5 -45 Z" fill={`url(#dark-${id})`} />
      <rect x="-15" y="-55" width="30" height="55" fill={`url(#side-${id})`} />
      <rect x="-5" y="-45" width="30" height="45" fill={`url(#dark-${id})`} />
      <ellipse cx="-40" cy="7" rx="5" ry="2" fill="#1a1c20" />
      <ellipse cx="40" cy="7" rx="5" ry="2" fill="#1a1c20" />
      <ellipse cx="0" cy="-30" rx="4" ry="4" fill="#1a1c20" />
    </g>
  </>),
  bust: (id) => (<>
    <Floor id={id} rx={55} ry={8} />
    <g transform="translate(100 100)">
      <ellipse cx="0" cy="55" rx="40" ry="10" fill={`url(#dark-${id})`} />
      <rect x="-40" y="40" width="80" height="15" fill={`url(#side-${id})`} />
      <ellipse cx="0" cy="40" rx="40" ry="10" fill={`url(#light-${id})`} />
      <path d="M-45 40 Q-45 10 -25 0 L25 0 Q45 10 45 40 Z" fill={`url(#side-${id})`} />
      <path d="M-12 5 L12 5 L14 -10 L-14 -10 Z" fill={`url(#light-${id})`} />
      <ellipse cx="0" cy="-30" rx="22" ry="28" fill={`url(#light-${id})`} />
      <path d="M-22 -25 Q-22 -55 0 -58 Q22 -55 22 -25 Q18 -10 0 -8 Q-18 -10 -22 -25 Z" fill={`url(#light-${id})`} />
      <path d="M-8 -28 Q-10 -36 -4 -36 M8 -28 Q10 -36 4 -36" stroke="#3f4550" strokeOpacity="0.4" fill="none" strokeWidth="1.2" />
      <path d="M-3 -22 Q0 -16 3 -22" stroke="#3f4550" strokeOpacity="0.5" fill="none" strokeWidth="1" />
    </g>
  </>),
  ring: (id) => (<>
    <Floor id={id} rx={55} ry={8} />
    <g transform="translate(100 110)">
      <ellipse rx="50" ry="20" fill="none" stroke={`url(#metal-${id})`} strokeWidth="14" />
      <ellipse rx="50" ry="20" fill="none" stroke="#1a1c20" strokeOpacity="0.25" strokeWidth="1" />
      <g transform="translate(0 -20)">
        <path d="M0 -16 L10 -4 L6 8 L-6 8 L-10 -4 Z" fill="#E8F2FF" stroke="#7AC7FF" />
        <path d="M0 -16 L10 -4 L0 -2 L-10 -4 Z" fill="#FFF" fillOpacity="0.7" />
      </g>
    </g>
  </>),
  cube: (id) => (<>
    <Floor id={id} rx={55} ry={8} />
    <g transform="translate(100 100)">
      <path d="M-40 -25 L0 -50 L40 -25 L0 0 Z" fill={`url(#light-${id})`} />
      <path d="M-40 -25 L0 0 L0 50 L-40 25 Z" fill={`url(#side-${id})`} />
      <path d="M40 -25 L0 0 L0 50 L40 25 Z" fill={`url(#dark-${id})`} />
      <text x="-20" y="20" fontFamily="monospace" fontSize="10" fill="#fff" opacity="0.3">X</text>
      <text x="13" y="20" fontFamily="monospace" fontSize="10" fill="#fff" opacity="0.3">Y</text>
      <text x="-3" y="-25" fontFamily="monospace" fontSize="10" fill="#3f4550" opacity="0.5">Z</text>
    </g>
  </>),
  chair: (id) => (<>
    <Floor id={id} rx={75} ry={11} />
    <g transform="translate(100 100)">
      <path d="M-30 -50 Q-35 -55 -30 -60 L20 -60 Q40 -55 35 -10 L-15 -10 Q-30 -10 -30 -25 Z" fill={`url(#side-${id})`} />
      <ellipse cx="0" cy="0" rx="48" ry="14" fill={`url(#light-${id})`} />
      <path d="M-48 0 Q-48 18 0 22 Q48 18 48 0 Q48 -8 0 -10 Q-48 -8 -48 0 Z" fill={`url(#side-${id})`} />
      <path d="M-30 8 L-32 50 L-26 50 L-24 12 Z" fill={`url(#dark-${id})`} />
      <path d="M30 8 L32 50 L26 50 L24 12 Z" fill={`url(#dark-${id})`} />
      <path d="M-10 18 L-11 55 L-7 55 L-6 20 Z" fill={`url(#dark-${id})`} />
    </g>
  </>),
  hex: (id) => (<>
    <Floor id={id} rx={70} ry={9} />
    <g transform="translate(100 110)">
      {[[0, 0], [35, -20], [-35, -20], [35, 20], [-35, 20], [0, -40], [0, 40]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <polygon points="-20,-12 -20,12 0,24 20,12 20,-12 0,-24" fill={`url(#side-${id})`} />
          <polygon points="-20,-12 0,-24 20,-12 0,0" fill={`url(#light-${id})`} />
        </g>
      ))}
    </g>
  </>),
  skull: (id) => (<>
    <Floor id={id} rx={55} ry={9} />
    <g transform="translate(100 100)">
      <ellipse cx="0" cy="-15" rx="38" ry="40" fill={`url(#light-${id})`} />
      <path d="M-30 5 Q-30 35 0 38 Q30 35 30 5 Z" fill={`url(#side-${id})`} />
      <ellipse cx="-15" cy="-15" rx="9" ry="11" fill="#15171b" />
      <ellipse cx="15" cy="-15" rx="9" ry="11" fill="#15171b" />
      <path d="M0 0 L-4 12 L0 14 L4 12 Z" fill="#15171b" />
      {[-12, -6, 0, 6, 12].map(x => <rect key={x} x={x - 2} y="22" width="4" height="8" fill={`url(#light-${id})`} stroke="#3f4550" strokeOpacity="0.3" />)}
    </g>
  </>),
  handle: (id) => (<>
    <Floor id={id} rx={70} ry={8} />
    <g transform="translate(100 110)">
      <rect x="-65" y="-5" width="100" height="14" rx="4" fill={`url(#metal-${id})`} />
      <rect x="35" y="-12" width="20" height="28" rx="4" fill={`url(#side-${id})`} />
      <rect x="-65" y="-3" width="100" height="3" fill="#fff" opacity="0.4" />
    </g>
  </>),
  torus: (id) => (<>
    <Floor id={id} rx={60} ry={9} />
    <g transform="translate(100 105)">
      <ellipse rx="55" ry="22" fill="none" stroke={`url(#metal-${id})`} strokeWidth="20" />
      <ellipse rx="55" ry="22" fill="none" stroke="#1a1c20" strokeOpacity="0.3" />
      <ellipse rx="35" ry="10" fill="#1a1c20" />
      <ellipse rx="35" ry="10" fill="none" stroke={`url(#dark-${id})`} strokeWidth="2" />
    </g>
  </>),
  vase: (id) => (<>
    <Floor id={id} rx={55} ry={9} />
    <g transform="translate(100 100)">
      <path d="M-25 -55 L25 -55 L20 -45 Q40 -10 30 30 Q30 50 0 55 Q-30 50 -30 30 Q-40 -10 -20 -45 Z" fill={`url(#light-${id})`} />
      <path d="M-25 -55 L25 -55 L20 -45 L-20 -45 Z" fill={`url(#dark-${id})`} />
      <path d="M-20 -40 Q-5 -10 -25 30" stroke="#3f4550" strokeOpacity="0.35" fill="none" strokeWidth="1" />
      <path d="M0 -45 Q15 -10 -5 35" stroke="#3f4550" strokeOpacity="0.35" fill="none" strokeWidth="1" />
      <path d="M20 -40 Q35 -10 15 30" stroke="#3f4550" strokeOpacity="0.35" fill="none" strokeWidth="1" />
    </g>
  </>),
  figure: (id) => (<>
    <Floor id={id} rx={45} ry={8} />
    <g transform="translate(100 100)">
      <rect x="-12" y="20" width="8" height="35" fill={`url(#side-${id})`} />
      <rect x="4" y="20" width="8" height="35" fill={`url(#dark-${id})`} />
      <path d="M-18 -20 L18 -20 L22 25 L-22 25 Z" fill={`url(#light-${id})`} />
      <path d="M18 -20 L22 25 L18 30 Z" fill={`url(#dark-${id})`} />
      <circle cx="0" cy="-32" r="13" fill={`url(#light-${id})`} />
      <rect x="-30" y="-15" width="10" height="30" fill={`url(#side-${id})`} transform="rotate(-15 -25 0)" />
      <rect x="20" y="-15" width="10" height="30" fill={`url(#dark-${id})`} transform="rotate(15 25 0)" />
      <rect x="-9" y="-35" width="18" height="5" fill="#15171b" />
    </g>
  </>),
  screw: (id) => (<>
    <Floor id={id} rx={45} ry={7} />
    <g transform="translate(100 100)">
      <ellipse cx="0" cy="-45" rx="20" ry="6" fill={`url(#light-${id})`} />
      <rect x="-20" y="-45" width="40" height="14" fill={`url(#metal-${id})`} />
      <ellipse cx="0" cy="-31" rx="20" ry="6" fill={`url(#dark-${id})`} />
      <path d="M-6 -48 L6 -48 L6 -42 L-6 -42 Z" fill="#15171b" />
      <rect x="-6" y="-30" width="12" height="65" fill={`url(#metal-${id})`} />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1="-6" y1={-28 + i * 5} x2="6" y2={-25 + i * 5} stroke="#3f4550" strokeOpacity="0.4" />
      ))}
    </g>
  </>),
  geodesic: (id) => (<>
    <Floor id={id} rx={70} ry={10} />
    <g transform="translate(100 100)" stroke="#3f4550" strokeOpacity="0.5" strokeWidth="0.8">
      <circle r="55" fill={`url(#light-${id})`} fillOpacity="0.1" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a1 = (i / 8) * Math.PI * 2;
        const a2 = ((i + 1) / 8) * Math.PI * 2;
        return <g key={i}>
          <line x1={Math.cos(a1) * 55} y1={Math.sin(a1) * 22} x2="0" y2="0" />
          <line x1={Math.cos(a1) * 55} y1={Math.sin(a1) * 22} x2={Math.cos(a2) * 55} y2={Math.sin(a2) * 22} />
          <polygon points={`0,0 ${Math.cos(a1) * 55},${Math.sin(a1) * 22} ${Math.cos(a2) * 55},${Math.sin(a2) * 22}`} fill={`url(#light-${id})`} fillOpacity={0.15 + (i % 3) * 0.15} />
        </g>;
      })}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <g key={i}>
          <line x1="0" y1="-55" x2={Math.cos(a) * 55} y2={Math.sin(a) * 22} strokeOpacity="0.3" />
        </g>;
      })}
    </g>
  </>),
  column: (id) => (<>
    <Floor id={id} rx={55} ry={9} />
    <g transform="translate(100 90)">
      <rect x="-32" y="-65" width="64" height="10" fill={`url(#light-${id})`} />
      <rect x="-28" y="-55" width="56" height="6" fill={`url(#side-${id})`} />
      <rect x="-22" y="-49" width="44" height="90" fill={`url(#light-${id})`} />
      {[-18, -10, -2, 6, 14].map((x, i) => (
        <rect key={i} x={x} y="-49" width="3" height="90" fill={`url(#dark-${id})`} fillOpacity="0.5" />
      ))}
      <rect x="-30" y="41" width="60" height="8" fill={`url(#side-${id})`} />
      <rect x="-34" y="49" width="68" height="10" fill={`url(#dark-${id})`} />
    </g>
  </>),
  earring: (id) => (<>
    <Floor id={id} rx={55} ry={8} />
    <g transform="translate(70 100)">
      <path d="M0 -40 L-8 0 L0 30 L8 0 Z" fill={`url(#metal-${id})`} stroke="#3f4550" strokeOpacity="0.5" />
      <line x1="0" y1="-40" x2="0" y2="-55" stroke={`url(#metal-${id})`} strokeWidth="1.5" />
    </g>
    <g transform="translate(130 100)">
      <path d="M0 -40 L-8 0 L0 30 L8 0 Z" fill={`url(#metal-${id})`} stroke="#3f4550" strokeOpacity="0.5" />
      <line x1="0" y1="-40" x2="0" y2="-55" stroke={`url(#metal-${id})`} strokeWidth="1.5" />
    </g>
  </>),
  box: (id) => (<>
    <Floor id={id} rx={70} ry={10} />
    <g transform="translate(100 100)">
      <path d="M-55 -25 L0 -50 L55 -25 L0 0 Z" fill={`url(#light-${id})`} />
      <path d="M-55 -25 L0 0 L0 45 L-55 20 Z" fill={`url(#side-${id})`} />
      <path d="M55 -25 L0 0 L0 45 L55 20 Z" fill={`url(#dark-${id})`} />
      <circle cx="-40" cy="-25" r="2.5" fill="#15171b" />
      <circle cx="40" cy="-25" r="2.5" fill="#15171b" />
      <circle cx="0" cy="-46" r="2.5" fill="#15171b" />
      <rect x="-50" y="0" width="8" height="10" fill={`url(#dark-${id})`} />
    </g>
  </>),
};

export const ModelThumbnail = ({ shape, modelId, bg = '#1a1c20' }) => {
  const id = `t-${modelId}`;
  const renderShape = shapes[shape] || shapes.cube;
  return (
    <svg viewBox="0 0 200 180" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', background: bg }}>
      <ClayDefs id={id} />
      {renderShape(id)}
    </svg>
  );
};
