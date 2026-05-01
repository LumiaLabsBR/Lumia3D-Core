import { Icon } from './Icons.jsx';

const hdrBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  height: 30, padding: '0 11px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 5, color: '#B4BAC2', fontSize: 12,
  fontFamily: 'inherit', cursor: 'pointer',
};

export const Header = ({ query, onQuery, view, onView, sort, onSort, resultCount }) => {
  return (
    <header style={{
      height: 56, flexShrink: 0, background: '#1a1c20',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14,
    }}>
      <div style={{
        flex: '0 1 480px', display: 'flex', alignItems: 'center', gap: 9,
        height: 34, padding: '0 12px', background: '#0f1115',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, color: '#7A8290',
      }}>
        <Icon name="search" size={14} stroke="#7A8290" strokeWidth={1.8} />
        <input value={query} onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar modelos, etiquetas, descrições…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E6E8EC', fontSize: 12.5, fontFamily: 'inherit' }} />
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#5A626C' }}>FTS5</span>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', color: '#5A626C' }}>⌘K</span>
      </div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: '#7A8290', letterSpacing: 0.4 }}>
        {resultCount} resultados
      </div>
      <div style={{ flex: 1 }} />
      <button className="hdr-btn" onClick={onSort} style={hdrBtn}>
        <Icon name="sortDesc" size={13} stroke="#B4BAC2" strokeWidth={1.7} />
        <span>{sort === 'date' ? 'Adicionado' : sort === 'name' ? 'Nome' : 'Tamanho'}</span>
      </button>
      <div style={{ display: 'flex', background: '#0f1115', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: 2 }}>
        {[{ id: 'gallery', icon: 'grid', label: 'Galeria' }, { id: 'list', icon: 'list', label: 'Lista' }].map(v => (
          <button key={v.id} onClick={() => onView(v.id)} title={v.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 26, border: 'none', borderRadius: 3,
            background: view === v.id ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: view === v.id ? '#E6E8EC' : '#7A8290', cursor: 'pointer',
          }}>
            <Icon name={v.icon} size={13} strokeWidth={1.7} />
          </button>
        ))}
      </div>
      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.06)' }} />
      <button className="hdr-btn" style={hdrBtn}>
        <Icon name="sliders" size={13} stroke="#B4BAC2" strokeWidth={1.7} />
        <span>Filtros</span>
      </button>
    </header>
  );
};
