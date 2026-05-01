import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { api as ipc } from './api/client.js';
import { api as library } from './api/library.js';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { Library } from './components/Library.jsx';
import { ModelDetail } from './components/Detail.jsx';
import { TweaksPanel } from './components/TweaksPanel.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { AboutModal } from './components/AboutModal.jsx';
import { LoadingSplash } from './components/LoadingSplash.jsx';
import { UpdateModal } from './components/UpdateModal.jsx';
import { Icon } from './components/Icons.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useCollections } from './hooks/useCollections.js';

const DEFAULT_TWEAKS  = { theme: 'dark', density: 'comfortable', defaultView: 'gallery' };
const DEFAULT_FILTERS = { selectedCat: null, activeTags: [], query: '', sort: 'date' };
const REPO_URL = 'https://github.com/LumiaLabsBR/Lumia3D-Core';

// ── Menu dropdown ─────────────────────────────────────────────────────────
const Menu = ({ open, items, onClose }) => {
  if (!open) return null;
  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      position: 'absolute', top: 32, left: 0, minWidth: 220,
      background: '#16181c', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6, padding: 4, zIndex: 100,
      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
      animation: 'slideUp 120ms ease-out',
    }}>
      {items.map((it, i) => it.divider ? (
        <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 6px' }} />
      ) : (
        <button key={i}
          disabled={it.disabled}
          onClick={() => { it.onClick?.(); onClose(); }}
          style={{
            width: '100%', textAlign: 'left',
            padding: '6px 12px', borderRadius: 3,
            border: 'none', background: 'transparent',
            color: it.disabled ? '#3F4550' : '#C7CDD5',
            fontSize: 12, cursor: it.disabled ? 'default' : 'pointer',
            display: 'flex', justifyContent: 'space-between', gap: 14,
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { if (!it.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
          <span>{it.label}</span>
          {it.shortcut && <span style={{ color: '#5A626C', fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>{it.shortcut}</span>}
        </button>
      ))}
    </div>
  );
};

const WindowChrome = ({ onTweaks, stats, menus }) => {
  const [openMenu, setOpenMenu] = useState(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenu]);

  const winCtl = (action) => () => ipc[`window${action}`]?.();

  return (
    <div style={{
      height: 36, flexShrink: 0, background: '#0f1115',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', padding: '0 8px 0 12px', gap: 14,
      fontSize: 12, color: '#9097A0', userSelect: 'none', position: 'relative',
    }}>
      <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
        {Object.entries(menus).map(([label, items]) => (
          <div key={label} style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === label ? null : label); }}
              style={{
                padding: '0 10px', height: 28, border: 'none',
                background: openMenu === label ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: openMenu === label ? '#E6E8EC' : '#9097A0',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 3,
              }}>
              {label}
            </button>
            <Menu open={openMenu === label} items={items} onClose={() => setOpenMenu(null)} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#5A626C' }}>
        Lumia3D Core — biblioteca local · {stats.count} modelos
        {stats.sizeMB > 0 && ` · ${stats.sizeMB >= 1024 ? (stats.sizeMB / 1024).toFixed(2) + ' GB' : stats.sizeMB.toFixed(1) + ' MB'}`}
      </div>
      <button onClick={onTweaks} title="Tweaks" style={{
        width: 28, height: 24, border: 'none', background: 'transparent',
        color: '#9097A0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="sliders" size={13} strokeWidth={1.7} />
      </button>
      <div style={{ display: 'flex', gap: 0, marginLeft: 4 }}>
        {[
          { key: 'minimize', action: winCtl('Minimize') },
          { key: 'maximize', action: winCtl('Maximize') },
          { key: 'close',    action: winCtl('Close')    },
        ].map(({ key, action }) => (
          <button key={key} onClick={action} style={{
            width: 38, height: 28, border: 'none', background: 'transparent',
            color: '#9097A0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = key === 'close' ? '#E81123' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#E6E8EC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9097A0'; }}>
            <Icon name={key} size={11} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
};

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

  const [models, setModels]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags]             = useState([]);
  const [stats, setStats]           = useState({ count: 0, sizeMB: 0, indexed: false });
  const [active, setActive]         = useState(null);
  const [importing, setImporting]   = useState(null);
  const [importStage, setImportStage] = useState('');
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // App-shell info do backend
  const [appInfo, setAppInfo] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [loading, setLoading]     = useState(true);

  // Update flow
  const [updateInfo, setUpdateInfo]           = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [updateMessage, setUpdateMessage]     = useState(null);

  // Settings persistidos no backend (UserSettings.json)
  const [settings, setSettings] = useState(null);
  useEffect(() => { ipc.getSettings().then(setSettings).catch(() => {}); }, []);
  const updateSettings = (next) => {
    setSettings(next);
    ipc.saveSettings(next).catch(() => {});
  };

  // Hidden file input para importação via menu/botão
  const fileInputRef = useRef(null);

  useEffect(() => { document.body.className = `theme-${tweaks.theme}`; }, [tweaks.theme]);

  // App info do backend C# via IPC
  useEffect(() => {
    ipc.getAppInfo()
      .then(setAppInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Carga inicial: categorias, tags, stats
  const refreshMeta = useCallback(() => {
    Promise.all([
      library.listCategories().then(setCategories),
      library.listTags().then(setTags),
      library.stats().then(setStats),
    ]).catch(() => {});
  }, []);
  useEffect(() => { refreshMeta(); }, [refreshMeta]);

  // Re-query models quando filtros mudam
  const refreshModels = useCallback(() => {
    library.listModels({
      catId: filters.selectedCat,
      tags: filters.activeTags,
      query: filters.query,
      sort: filters.sort,
    }).then(setModels).catch(() => {});
  }, [filters]);
  useEffect(() => { refreshModels(); }, [refreshModels]);

  // Push events do backend C#
  useEffect(() => {
    const off1 = ipc.on('thumbnailReady',  () => refreshModels());
    const off2 = ipc.on('importProgress',  ({ fileName }) => setImportStage(fileName || 'importando'));
    const off3 = ipc.on('importCounts',    () => setImporting((p) => p == null ? null : Math.min(99, p + 1)));
    const off4 = ipc.on('importComplete',  () => {
      setImporting(100);
      refreshMeta(); refreshModels();
      setTimeout(() => { setImporting(null); setImportStage(''); }, 600);
    });

    // Update flow
    const off5 = ipc.on('updateAvailable',     (info) => setUpdateInfo(info));
    const off6 = ipc.on('updateNotAvailable',  () => {
      setUpdateMessage('Você está na versão mais recente.');
      setTimeout(() => setUpdateMessage(null), 3000);
    });
    const off7 = ipc.on('updateCheckError',    ({ message }) => {
      setUpdateMessage(`Erro ao verificar atualização: ${message}`);
      setTimeout(() => setUpdateMessage(null), 4000);
    });
    const off8 = ipc.on('downloadProgress',    ({ percent }) => setDownloadProgress(percent));
    const off9 = ipc.on('downloadComplete',    () => {
      setDownloadProgress(100);
      // Backend lança o instalador; ele pede pra fechar a app pra atualizar.
      // Mantém o modal aberto até o usuario fechar manualmente.
    });
    const offA = ipc.on('downloadError',       ({ message }) => {
      setDownloadProgress(null);
      setUpdateMessage(`Falha no download: ${message}`);
      setTimeout(() => setUpdateMessage(null), 4000);
    });
    const offB = ipc.on('downloadCanceled',    () => setDownloadProgress(null));

    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); off8(); off9(); offA(); offB(); };
  }, [refreshModels, refreshMeta]);

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

  // ── Import handlers ──
  const IS_PHOTINO = typeof window !== 'undefined' && typeof window.external?.sendMessage === 'function';

  const runImport = async (importer) => {
    setImporting(0);
    const result = await importer(({ progress, stage }) => {
      setImporting(progress);
      setImportStage(stage);
    });
    refreshMeta(); refreshModels();
    setTimeout(() => { setImporting(null); setImportStage(''); }, 600);
    return result;
  };

  const importFiles = (files) => {
    if (!files?.length) return;
    return runImport((onProgress) => library.importFiles(files, onProgress));
  };

  const importPaths = (paths) => {
    if (!paths?.length) return;
    return runImport((onProgress) => library.importPaths(paths, onProgress));
  };

  const onDrop = (e) => {
    e.preventDefault();
    importFiles(Array.from(e.dataTransfer?.files || []));
  };

  // Em Photino: chama dialog Win32 nativo (paths reais).
  // Em dev (browser): cai no <input type="file"> escondido.
  const onPickFiles = async () => {
    if (IS_PHOTINO) {
      const paths = await ipc.pickFiles();
      importPaths(paths);
    } else {
      fileInputRef.current?.click();
    }
  };

  // Importar pasta — só Photino (não tem equivalente em browser dev)
  const onPickFolder = async () => {
    if (!IS_PHOTINO) return;
    const path = await ipc.pickFolder();
    if (!path) return;
    setImporting(0);
    setImportStage('lendo pasta…');
    await ipc.importFolder(path, null);
    // refresh acontece via push events (importComplete listener)
  };
  const onFilesPicked = (e) => {
    importFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  // ── Menus ──
  const menus = {
    'Arquivo': [
      { label: 'Importar arquivos…', shortcut: 'Ctrl+O', onClick: onPickFiles },
      { label: 'Importar pasta…',    shortcut: 'Ctrl+Shift+O', onClick: onPickFolder, disabled: !IS_PHOTINO },
      { divider: true },
      { label: 'Recarregar biblioteca', onClick: () => { refreshMeta(); refreshModels(); } },
      { divider: true },
      { label: 'Sair', shortcut: 'Alt+F4', onClick: () => ipc.windowClose() },
    ],
    'Editar': [
      { label: 'Limpar filtros', onClick: () => setFilters(DEFAULT_FILTERS) },
      { label: 'Resetar tweaks', onClick: resetTweaks },
    ],
    'Visualizar': [
      { label: 'Galeria', onClick: () => setView('gallery') },
      { label: 'Lista',   onClick: () => setView('list') },
      { divider: true },
      { label: 'Tweaks…', onClick: () => setTweaksOpen(true) },
    ],
    'Biblioteca': [
      { label: 'Importar arquivos…', onClick: onPickFiles },
      { label: 'Estatísticas: ' + stats.count + ' modelos', disabled: true },
    ],
    'Ajuda': [
      { label: 'Sobre o Lumia3D Core', onClick: () => setAboutOpen(true) },
      { label: 'Verificar atualizações', onClick: () => ipc.checkForUpdate() },
      { divider: true },
      { label: 'Repositório no GitHub', onClick: () => ipc.openExternal(REPO_URL) },
      { label: 'Reportar problema',     onClick: () => ipc.openExternal(REPO_URL + '/issues') },
    ],
  };

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0a0b0e', color: '#E6E8EC', overflow: 'hidden', position: 'relative',
    }}>
      <input
        ref={fileInputRef} type="file" multiple
        accept=".stl,.obj,.3mf,.step,.stp"
        onChange={onFilesPicked}
        style={{ display: 'none' }}
      />
      <WindowChrome onTweaks={() => setTweaksOpen((o) => !o)} stats={stats} menus={menus} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          categories={categories} tags={tags} stats={stats}
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
          onImport={onPickFiles}
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
          allTags={tags}
          isFavorite={isFavorite(active.id)}
          onToggleFavorite={() => toggleFavorite(active.id)}
          collections={collections}
          onAddToCollection={(cid) => addToCollection(cid, active.id)}
          onRemoveFromCollection={(cid) => removeFromCollection(cid, active.id)}
          onUpdateModel={async (patch) => {
            await ipc.updateObject(active.id, patch.name ?? active.name, patch.description ?? active.description ?? '', patch.cat ?? active.cat ?? null);
            setActive({ ...active, ...patch });
            refreshModels();
          }}
          onAddTag={async (tagName) => {
            const tag = await ipc.createTag(tagName, null);
            await ipc.addTagToObject(active.id, tag.id);
            refreshMeta(); refreshModels();
            setActive({ ...active, tags: [...(active.tags || []), tag.name] });
          }}
          onRemoveTag={async (tagName) => {
            const tag = tags.find(t => t.name === tagName);
            if (!tag) return;
            await ipc.removeTagFromObject(active.id, tag.id);
            refreshMeta(); refreshModels();
            setActive({ ...active, tags: (active.tags || []).filter(t => t !== tagName) });
          }}
          onDelete={async () => {
            await ipc.deleteObject(active.id);
            setActive(null);
            refreshMeta(); refreshModels();
          }}
        />
      )}
      {importing != null && <Toast progress={importing} stage={importStage} />}
      {tweaksOpen && (
        <TweaksPanel
          tweaks={tweaks}
          setTweaks={setTweaks}
          onReset={resetTweaks}
          onClose={() => setTweaksOpen(false)}
          settings={settings}
          onSettingsChange={updateSettings}
        />
      )}
      {aboutOpen && <AboutModal appInfo={appInfo} onClose={() => setAboutOpen(false)} />}
      {updateInfo && (
        <UpdateModal
          info={updateInfo}
          downloadProgress={downloadProgress}
          onLater={() => { setUpdateInfo(null); setDownloadProgress(null); }}
          onDownload={() => {
            setDownloadProgress(0);
            ipc.downloadUpdate(updateInfo.installerUrl, updateInfo.sha256Url, updateInfo.installerSize);
          }}
        />
      )}
      {updateMessage && (
        <div style={{
          position: 'fixed', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1c20', border: '1px solid rgba(255,255,255,0.08)',
          color: '#E6E8EC', padding: '10px 16px', borderRadius: 6, zIndex: 60,
          fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'slideUp 200ms ease-out',
        }}>
          {updateMessage}
        </div>
      )}
      <LoadingSplash visible={loading} />
    </div>
  );
}
