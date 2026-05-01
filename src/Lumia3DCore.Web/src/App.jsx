import { useState, useMemo, useEffect, useCallback } from 'react';
import { LUMIA_DATA } from './data.js';
import { api } from './api/client.js';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { Library } from './components/Library.jsx';
import { ModelDetail } from './components/Detail.jsx';
import { TweaksPanel } from './components/TweaksPanel.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { AboutModal } from './components/AboutModal.jsx';
import { LoadingSplash } from './components/LoadingSplash.jsx';
import { Icon } from './components/Icons.jsx';

const WindowChrome = ({ onTweaks }) => (
  <div style={{
    height: 36, flexShrink: 0, background: '#0f1115',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', padding: '0 8px 0 12px', gap: 14,
    fontSize: 12, color: '#9097A0', userSelect: 'none',
  }}>
    <div style={{ display: 'flex', gap: 14, fontFamily: 'inherit' }}>
      {['Arquivo', 'Editar', 'Visualizar', 'Biblioteca', 'Ajuda'].map(m => (
        <span key={m} style={{ cursor: 'default' }}>{m}</span>
      ))}
    </div>
    <div style={{ flex: 1, textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#5A626C' }}>
      Lumia3D Core — biblioteca local · 274 modelos · 1.84 GB
    </div>
    <button onClick={onTweaks} title="Tweaks" style={{
      width: 28, height: 24, border: 'none', background: 'transparent',
      color: '#9097A0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name="sliders" size={13} strokeWidth={1.7} />
    </button>
    <div style={{ display: 'flex', gap: 0, marginLeft: 4 }}>
      {['minimize', 'maximize', 'close'].map((b, i) => (
        <button key={b} style={{
          width: 38, height: 28, border: 'none',
          background: b === 'close' ? 'transparent' : 'transparent',
          color: '#9097A0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = b === 'close' ? '#E81123' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9097A0'; }}>
          <Icon name={b} size={11} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  </div>
);

const Toast = ({ progress }) => (
  <div style={{
    position: 'absolute', bottom: 18, right: 18, zIndex: 40,
    width: 320, background: '#1a1c20', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6, padding: '12px 14px', boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
    animation: 'slideUp 200ms ease-out',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <Icon name="upload" size={13} stroke="#FFA85F" strokeWidth={1.8} />
      <div style={{ flex: 1, fontSize: 12, color: '#E6E8EC' }}>Importando 3 arquivos…</div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: '#7A8290' }}>{Math.round(progress)}%</div>
    </div>
    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #FF8A2E, #FFA85F)', transition: 'width 80ms linear' }} />
    </div>
    <div style={{ marginTop: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>
      Calculando hash · indexando metadados…
    </div>
  </div>
);

export default function App() {
  const [selectedCat, setSelectedCat] = useState(null);
  const [activeTags, setActiveTags] = useState(new Set());
  const [query, setQuery] = useState('');
  const [view, setView] = useState('gallery');
  const [sort, setSort] = useState('date');
  const [active, setActive] = useState(null);
  const [importing, setImporting] = useState(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tweaks, setTweaks] = useState({ theme: 'dark', density: 'comfortable' });
  const [appInfo, setAppInfo] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAppInfo()
      .then(setAppInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleTag = useCallback((t) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }, []);

  const cycleSort = () => setSort(s => s === 'date' ? 'name' : s === 'name' ? 'size' : 'date');

  const models = useMemo(() => {
    const allCats = (id) => {
      if (!id) return null;
      const cat = LUMIA_DATA.categories.find(c => c.id === id);
      if (cat?.children) return new Set([id, ...cat.children.map(c => c.id)]);
      return new Set([id]);
    };
    const catSet = allCats(selectedCat);
    let list = LUMIA_DATA.models.filter(m => {
      if (catSet && !catSet.has(m.cat)) return false;
      if (activeTags.size > 0 && !m.tags.some(t => activeTags.has(t))) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.tags.join(' ').toLowerCase().includes(q) && !m.file.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (sort === 'date') list.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'size') list.sort((a, b) => b.sizeKB - a.sizeKB);
    return list;
  }, [selectedCat, activeTags, query, sort]);

  const onDrop = (e) => {
    e.preventDefault();
    setImporting(0);
  };

  useEffect(() => {
    if (importing == null) return;
    if (importing >= 100) {
      const t = setTimeout(() => setImporting(null), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setImporting(p => Math.min(100, p + 4 + Math.random() * 5)), 80);
    return () => clearTimeout(t);
  }, [importing]);

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0a0b0e', color: '#E6E8EC', overflow: 'hidden', position: 'relative',
    }}>
      <WindowChrome onTweaks={() => setTweaksOpen(o => !o)} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          selectedCat={selectedCat}
          onSelectCat={setSelectedCat}
          activeTags={activeTags}
          onToggleTag={toggleTag}
        />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header
            query={query}
            onQuery={setQuery}
            view={view}
            onView={setView}
            sort={sort}
            onSort={cycleSort}
            resultCount={models.length}
          />
          <Library models={models} view={view} onOpen={setActive} />
        </main>
      </div>
      <StatusBar
        modelCount={models.length}
        appInfo={appInfo}
        onAbout={() => setAboutOpen(true)}
      />
      {active && <ModelDetail model={active} onClose={() => setActive(null)} />}
      {importing != null && <Toast progress={importing} />}
      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)} />}
      {aboutOpen && <AboutModal appInfo={appInfo} onClose={() => setAboutOpen(false)} />}
      <LoadingSplash visible={loading} />
    </div>
  );
}
