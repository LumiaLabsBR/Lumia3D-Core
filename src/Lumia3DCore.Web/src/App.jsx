import { useState, useMemo, useEffect, useCallback } from 'react';
import { api as ipc } from './api/client.js';      // IPC Photino → backend C# (getAppInfo, etc.)
import { api as library } from './api/library.js'; // interface async para dados da biblioteca
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { Library } from './components/Library.jsx';
import { ModelDetail } from './components/Detail.jsx';
import { TweaksPanel } from './components/TweaksPanel.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { AboutModal } from './components/AboutModal.jsx';
import { LoadingSplash } from './components/LoadingSplash.jsx';
import { Icon } from './components/Icons.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useCollections } from './hooks/useCollections.js';

const DEFAULT_TWEAKS  = { theme: 'dark', density: 'comfortable', defaultView: 'gallery' };
const DEFAULT_FILTERS = { selectedCat: null, activeTags: [], query: '', sort: 'date' };

const WindowChrome = ({ onTweaks, stats }) => (
  <div style={{
    height: 36, flexShrink: 0, background: '#0f1115',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', padding: '0 8px 0 12px', gap: 14,
    fontSize: 12, color: '#9097A0', userSelect: 'none',
  }}>
    <div style={{ display: 'flex', gap: 14 }}>
      {['Arquivo', 'Editar', 'Visualizar', 'Biblioteca', 'Ajuda'].map(m => (
        <span key={m} style={{ cursor: 'default' }}>{m}</span>
      ))}
    </div>
    <div style={{ flex: 1, textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#5A626C' }}>
      Lumia3D Core — biblioteca local · {stats.count} modelos · {stats.sizeMB?.toFixed(2)} GB
    </div>
    <button onClick={onTweaks} title="Tweaks" style={{
      width: 28, height: 24, border: 'none', background: 'transparent',
      color: '#9097A0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name="sliders" size={13} strokeWidth={1.7} />
    </button>
    <div style={{ display: 'flex', gap: 0, marginLeft: 4 }}>
      {['minimize', 'maximize', 'close'].map(b => (
        <button key={b} style={{
          width: 38, height: 28, border: 'none', background: 'transparent',
          color: '#9097A0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = b === 'close' ? '#E81123' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#E6E8EC'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9097A0'; }}>
          <Icon name={b} size={11} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  </div>
);

const Toast = ({ progress, stage }) => (
  <div style={{
    position: 'absolute', bottom: 30, right: 18, zIndex: 40,
    width: 320, background: '#1a1c20', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6, padding: '12px 14px', boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
    animation: 'slideUp 200ms ease-out',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <Icon name="upload" size={13} stroke="#FFA85F" strokeWidth={1.8} />
      <div style={{ flex: 1, fontSize: 12, color: '#E6E8EC' }}>Importando arquivos…</div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: '#7A8290' }}>{Math.round(progress)}%</div>
    </div>
    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #FF8A2E, #FFA85F)', transition: 'width 80ms linear' }} />
    </div>
    <div style={{ marginTop: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>
      stage: {stage || 'preparando'}…
    </div>
  </div>
);

export default function App() {
  const [tweaks, setTweaks, resetTweaks] = useLocalStorage('tweaks', DEFAULT_TWEAKS);
  const [filters, setFilters] = useLocalStorage('filters', DEFAULT_FILTERS);
  const [view, setView] = useLocalStorage('view', tweaks.defaultView || 'gallery');
  const [selectedCollection, setSelectedCollection] = useLocalStorage('selectedCollection', null);

  const collectionsApi = useCollections();
  const {
    favorites, collections, isFavorite, toggleFavorite,
    createCollection, deleteCollection, addToCollection, removeFromCollection,
    getCollection, FAV_ID,
  } = collectionsApi;

  const [models, setModels] = useState([]);
  const [stats, setStats]   = useState({ count: 0, sizeMB: 0 });
  const [active, setActive] = useState(null);
  const [importing, setImporting] = useState(null);
  const [importStage, setImportStage] = useState('');
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // App-shell info (vem do backend C# real via IPC)
  const [appInfo, setAppInfo] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [loading, setLoading]     = useState(true);

  // Tema persistido aplicado ao body
  useEffect(() => { document.body.className = `theme-${tweaks.theme}`; }, [tweaks.theme]);

  // Carrega versão do backend (única chamada IPC real por agora)
  useEffect(() => {
    ipc.getAppInfo()
      .then(setAppInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Stats agregadas (count, sizeMB) da biblioteca
  useEffect(() => { library.stats().then(setStats); }, []);

  // Push events do backend C#: thumbnail pronto, import progress, etc.
  // ipc.on retorna uma função de cleanup (unsubscribe).
  useEffect(() => {
    const off1 = ipc.on('thumbnailReady', () => {
      // Re-query modelos para puxar o novo thumbnailUrl
      library.listModels({
        catId: filters.selectedCat,
        tags: filters.activeTags,
        query: filters.query,
        sort: filters.sort,
      }).then(setModels);
    });
    const off2 = ipc.on('importProgress', ({ fileName }) => setImportStage(fileName || 'importando'));
    const off3 = ipc.on('importCounts', ({ objectsImported }) => {
      setImporting((p) => p == null ? null : Math.min(99, p + 1));
    });
    const off4 = ipc.on('importComplete', () => {
      setImporting(100);
      library.stats().then(setStats);
      library.listModels({
        catId: filters.selectedCat,
        tags: filters.activeTags,
        query: filters.query,
        sort: filters.sort,
      }).then(setModels);
      setTimeout(() => { setImporting(null); setImportStage(''); }, 600);
    });
    return () => { off1(); off2(); off3(); off4(); };
  }, [filters]);

  // Re-query quando filtros mudam
  useEffect(() => {
    let cancelled = false;
    library.listModels({
      catId: filters.selectedCat,
      tags: filters.activeTags,
      query: filters.query,
      sort: filters.sort,
    }).then((list) => { if (!cancelled) setModels(list); });
    return () => { cancelled = true; };
  }, [filters.selectedCat, filters.activeTags, filters.query, filters.sort]);

  // Filtra ainda mais se uma collection estiver selecionada
  const visibleModels = useMemo(() => {
    if (!selectedCollection) return models;
    const col = getCollection(selectedCollection);
    if (!col) return models;
    const set = new Set(col.modelIds);
    return models.filter((m) => set.has(m.id));
  }, [models, selectedCollection, getCollection]);

  const setSelectedCat = (id) => setFilters({ ...filters, selectedCat: id });
  const setQuery = (q) => setFilters({ ...filters, query: q });
  const cycleSort = () => setFilters({
    ...filters,
    sort: filters.sort === 'date' ? 'name' : filters.sort === 'name' ? 'size' : 'date',
  });
  const toggleTag = useCallback((t) => {
    setFilters((prev) => {
      const set = new Set(prev.activeTags);
      set.has(t) ? set.delete(t) : set.add(t);
      return { ...prev, activeTags: [...set] };
    });
  }, [setFilters]);

  const activeTagsSet = useMemo(() => new Set(filters.activeTags), [filters.activeTags]);

  const onDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    setImporting(0);
    await library.importFiles(files.length ? files : [{ name: 'sample.stl' }], ({ progress, stage }) => {
      setImporting(progress);
      setImportStage(stage);
    });
    // Refresh contadores depois do import
    library.stats().then(setStats);
    setTimeout(() => { setImporting(null); setImportStage(''); }, 600);
  };

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0a0b0e', color: '#E6E8EC', overflow: 'hidden', position: 'relative',
    }}>
      <WindowChrome onTweaks={() => setTweaksOpen((o) => !o)} stats={stats} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          selectedCat={filters.selectedCat}
          onSelectCat={setSelectedCat}
          activeTags={activeTagsSet}
          onToggleTag={toggleTag}
          collections={collections}
          favorites={favorites}
          FAV_ID={FAV_ID}
          selectedCollection={selectedCollection}
          onSelectCollection={setSelectedCollection}
          onCreateCollection={createCollection}
          onDeleteCollection={deleteCollection}
        />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header
            query={filters.query}
            onQuery={setQuery}
            view={view}
            onView={setView}
            sort={filters.sort}
            onSort={cycleSort}
            resultCount={visibleModels.length}
          />
          <Library
            models={visibleModels} view={view} onOpen={setActive}
            isFavorite={isFavorite} toggleFavorite={toggleFavorite}
          />
        </main>
      </div>
      <StatusBar
        modelCount={visibleModels.length}
        appInfo={appInfo}
        onAbout={() => setAboutOpen(true)}
      />
      {active && (
        <ModelDetail
          model={active} onClose={() => setActive(null)}
          isFavorite={isFavorite(active.id)}
          onToggleFavorite={() => toggleFavorite(active.id)}
          collections={collections}
          onAddToCollection={(cid) => addToCollection(cid, active.id)}
          onRemoveFromCollection={(cid) => removeFromCollection(cid, active.id)}
        />
      )}
      {importing != null && <Toast progress={importing} stage={importStage} />}
      {tweaksOpen && (
        <TweaksPanel
          tweaks={tweaks}
          setTweaks={setTweaks}
          onReset={resetTweaks}
          onClose={() => setTweaksOpen(false)}
        />
      )}
      {aboutOpen && <AboutModal appInfo={appInfo} onClose={() => setAboutOpen(false)} />}
      <LoadingSplash visible={loading} />
    </div>
  );
}
