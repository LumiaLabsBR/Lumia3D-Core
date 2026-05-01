// Reusable icons + small components

export const Icon = ({ name, size = 16, stroke = 'currentColor', strokeWidth = 1.6 }) => {
  const paths = {
    search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
    plus: (<><path d="M12 5v14M5 12h14" /></>),
    upload: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>),
    grid: (<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>),
    list: (<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>),
    chevronRight: (<path d="M9 18l6-6-6-6" />),
    chevronDown: (<path d="M6 9l6 6 6-6" />),
    folder: (<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />),
    folderOpen: (<><path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7H10l-2-2H3z" /><path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1" /></>),
    tag: (<><path d="M20 12L12 20l-8-8V4h8z" /><circle cx="7.5" cy="7.5" r="1" /></>),
    close: (<><path d="M18 6L6 18M6 6l12 12" /></>),
    settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
    cube: (<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96L12 12.01l8.73-5.05" /><path d="M12 22.08V12" /></>),
    paperclip: (<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />),
    file: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>),
    duplicate: (<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>),
    sliders: (<><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>),
    sortDesc: (<><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 4v16" /></>),
    eye: (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>),
    download: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>),
    info: (<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>),
    refresh: (<><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" /><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" /></>),
    image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>),
    code: (<><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></>),
    pdf: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><text x="7" y="18" fontSize="6" fontFamily="monospace" stroke="none" fill="currentColor">PDF</text></>),
    sun: (<><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>),
    moon: (<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />),
    rotate: (<><path d="M3 12a9 9 0 1 0 9-9" /><path d="M3 4v5h5" /></>),
    trash: (<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>),
    star: (<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
};

export const FormatBadge = ({ format }) => {
  const colors = {
    stl: { bg: 'rgba(255, 122, 26, 0.15)', fg: '#FFA85F' },
    '3mf': { bg: 'rgba(159, 124, 255, 0.18)', fg: '#B69DFF' },
    obj: { bg: 'rgba(122, 199, 255, 0.15)', fg: '#7AC7FF' },
  };
  const c = colors[format] || colors.stl;
  return (
    <span style={{
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 9.5,
      fontWeight: 600,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      padding: '2px 6px',
      borderRadius: 3,
      background: c.bg,
      color: c.fg,
    }}>{format}</span>
  );
};

export const Tag = ({ name, color, count, onClick, active }) => {
  const dotColor = color || '#9097A0';
  return (
    <button onClick={onClick} className="tag-pill" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px',
      borderRadius: 4,
      border: active ? '1px solid rgba(255, 122, 26, 0.5)' : '1px solid rgba(255,255,255,0.06)',
      background: active ? 'rgba(255, 122, 26, 0.12)' : 'rgba(255,255,255,0.025)',
      color: active ? '#FFA85F' : '#B4BAC2',
      fontSize: 11.5,
      fontFamily: 'inherit',
      cursor: 'pointer',
      transition: 'all 120ms',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
      {name}
      {count != null && <span style={{ opacity: 0.5, fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>{count}</span>}
    </button>
  );
};
