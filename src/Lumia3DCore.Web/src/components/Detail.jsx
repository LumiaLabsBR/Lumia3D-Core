import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Icon, FormatBadge, Tag } from './Icons.jsx';
import { SectionLabel } from './Sidebar.jsx';
import { buildProcedural, matClay } from '../three/procedural.js';
import { loadModel } from '../three/loaders.js';

const ThreeViewer = ({ model, autoRotate, showGrid, brightness }) => {
  const ref = useRef(null);
  const stateRef = useRef({});
  const [loading, setLoading] = useState(false);

  // Sincroniza opções com a cena viva via ref (evita re-criar a scene a cada toggle)
  const optsRef = useRef({ autoRotate, showGrid, brightness });
  useEffect(() => { optsRef.current = { autoRotate, showGrid, brightness }; }, [autoRotate, showGrid, brightness]);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0b0e');
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(3.2, 2.4, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xff8a3a, 0.35);
    fill.position.set(-4, 2, -2);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0x404858, 0.6));

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.45 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(10, 20, 0x2a2e34, 0x1a1c20);
    grid.position.y = -1;
    scene.add(grid);
    grid.visible = optsRef.current.showGrid !== false;

    let obj = buildProcedural(model.shape);
    scene.add(obj);

    let cancelled = false;
    if (model.url) {
      setLoading(true);
      loadModel({ url: model.url, format: model.format }, matClay)
        .then((loaded) => {
          if (cancelled || !loaded) return;
          scene.remove(obj);
          obj = loaded;
          scene.add(obj);
        })
        .catch((err) => console.warn('[Lumia3D] failed to load', model.url, err))
        .finally(() => { if (!cancelled) setLoading(false); });
    }

    let raf;
    const start = performance.now();

    const onPointerDown = (e) => {
      stateRef.current.dragging = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
    };
    const onPointerMove = (e) => {
      if (!stateRef.current.dragging) return;
      const dx = e.clientX - stateRef.current.lastX;
      const dy = e.clientY - stateRef.current.lastY;
      obj.rotation.y += dx * 0.01;
      obj.rotation.x += dy * 0.01;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
    };
    const onPointerUp = () => { stateRef.current.dragging = false; };
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.multiplyScalar(1 + e.deltaY * 0.001);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const opts = optsRef.current;
      if (opts.autoRotate && !stateRef.current.dragging && obj) {
        obj.rotation.y = (performance.now() - start) * 0.0005;
      }
      grid.visible = opts.showGrid !== false;
      key.intensity = 0.6 + (opts.brightness ?? 0.5) * 1.4;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w2 = container.clientWidth, h2 = container.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [model.id, model.shape, model.url, model.format]);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', cursor: 'grab', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          padding: '4px 8px', borderRadius: 3,
          background: 'rgba(0,0,0,0.55)', color: '#FFA85F',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          letterSpacing: 0.6, textTransform: 'uppercase',
          border: '1px solid rgba(255, 122, 26, 0.3)',
        }}>
          carregando malha…
        </div>
      )}
    </div>
  );
};

const ViewerToggle = ({ icon, active, onClick, title }) => (
  <button onClick={onClick} title={title} style={{
    width: 28, height: 28, borderRadius: 4,
    background: active ? 'rgba(255, 122, 26, 0.18)' : 'rgba(0,0,0,0.5)',
    border: active ? '1px solid rgba(255, 122, 26, 0.4)' : '1px solid rgba(255,255,255,0.06)',
    color: active ? '#FFA85F' : '#C7CDD5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', backdropFilter: 'blur(6px)',
  }}>
    <Icon name={icon} size={13} strokeWidth={1.7} />
  </button>
);

const KV = ({ k, v, mono }) => (
  <>
    <div style={{ color: '#7A8290', fontSize: 11.5 }}>{k}</div>
    <div style={{ color: '#E6E8EC', fontSize: 11.5, fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit' }}>{v}</div>
  </>
);

const tagAddBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 9px', borderRadius: 4,
  border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent',
  color: '#7A8290', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
};

const footerBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  height: 32, padding: '0 12px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 4, color: '#C7CDD5', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
};

// ── Tag picker popover ────────────────────────────────────────────────────
const TagPicker = ({ allTags, currentTags, onAdd, onClose }) => {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const close = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  const currentSet = new Set(currentTags);
  const filtered = allTags.filter(t => !currentSet.has(t.name) &&
    (draft === '' || t.name.toLowerCase().includes(draft.toLowerCase())));

  const submitDraft = () => {
    const n = draft.trim();
    if (!n) return;
    if (currentSet.has(n)) return;
    onAdd(n);
    setDraft('');
    onClose();
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      position: 'absolute', top: 30, left: 0, zIndex: 30,
      width: 220, background: '#0f1115', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6, padding: 6, boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
      animation: 'slideUp 120ms ease-out',
    }}>
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submitDraft(); }}
        placeholder="buscar ou criar etiqueta…"
        style={{
          width: '100%', height: 26, padding: '0 8px', boxSizing: 'border-box',
          background: '#1a1c20', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 4, color: '#E6E8EC', fontSize: 11.5, fontFamily: 'inherit',
          outline: 'none',
        }} />
      <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filtered.map(t => (
          <button key={t.id || t.name}
            onClick={() => { onAdd(t.name); onClose(); }}
            style={{
              padding: '5px 8px', borderRadius: 3, border: 'none', textAlign: 'left',
              background: 'transparent', color: '#C7CDD5', fontSize: 11.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color || '#9097A0' }} />
            {t.name}
          </button>
        ))}
        {draft && !allTags.some(t => t.name.toLowerCase() === draft.toLowerCase()) && (
          <button onClick={submitDraft} style={{
            padding: '5px 8px', borderRadius: 3, border: 'none', textAlign: 'left',
            background: 'rgba(255, 122, 26, 0.08)', color: '#FFA85F', fontSize: 11.5,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
          }}>
            <Icon name="plus" size={10} strokeWidth={2.4} /> criar "{draft}"
          </button>
        )}
        {filtered.length === 0 && !draft && (
          <div style={{ padding: '6px 8px', fontSize: 11, color: '#5A626C', fontStyle: 'italic' }}>
            Nenhuma etiqueta disponível.
          </div>
        )}
      </div>
    </div>
  );
};

// ── ModelDetail ────────────────────────────────────────────────────────────
export const ModelDetail = ({
  model, onClose,
  allTags = [],
  isFavorite, onToggleFavorite,
  collections = [], onAddToCollection, onRemoveFromCollection,
  onUpdateModel, onAddTag, onRemoveTag, onDelete,
}) => {
  if (!model) return null;
  const tagColors = Object.fromEntries(allTags.map(t => [t.name, t.color || '#9097A0']));

  // ── Inline edit do nome ──
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(model.name);
  useEffect(() => { setDraftName(model.name); }, [model.name]);

  const commitName = () => {
    const n = draftName.trim();
    if (n && n !== model.name) onUpdateModel?.({ name: n });
    setEditingName(false);
  };

  // ── Tag picker visivel? ──
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    if (!pickerOpen) return;
    const onClick = () => setPickerOpen(false);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [pickerOpen]);

  // ── Viewer controls (locais) ──
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid]     = useState(true);
  const [brightness, setBrightness] = useState(0.5);

  // ── Confirm delete ──
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0,
      background: 'rgba(8, 9, 12, 0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, animation: 'fadeIn 140ms ease-out',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(1080px, 92%)', height: 'min(680px, 90%)',
        background: '#1a1c20', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        display: 'flex', overflow: 'hidden',
        animation: 'slideUp 200ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0b0e', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <ThreeViewer model={model} autoRotate={autoRotate} showGrid={showGrid} brightness={brightness} />
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
              <FormatBadge format={model.format} />
              {model.polys > 0 && (
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'rgba(0,0,0,0.5)', color: '#9097A0', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {(model.polys / 1000).toFixed(0)}k tris
                </span>
              )}
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 6 }}>
              <ViewerToggle icon="rotate"  active={autoRotate} onClick={() => setAutoRotate(v => !v)} title="Rotação automática" />
              <ViewerToggle icon="grid"    active={showGrid}   onClick={() => setShowGrid(v => !v)}   title="Mostrar grade" />
              <ViewerToggle icon="sun"     active={brightness > 0.5} onClick={() => setBrightness(b => b > 0.5 ? 0.3 : 0.8)} title="Iluminação" />
            </div>
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, color: '#5A626C',
              padding: '3px 7px', borderRadius: 3,
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              arraste para rotacionar · scroll para zoom
            </div>
          </div>
        </div>
        <div style={{
          width: 360, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', background: '#16181c',
        }}>
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingName ? (
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={commitName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitName();
                      if (e.key === 'Escape') { setDraftName(model.name); setEditingName(false); }
                    }}
                    style={{
                      width: '100%', padding: '4px 6px',
                      fontSize: 16, fontWeight: 600, color: '#E6E8EC',
                      background: '#0f1115', border: '1px solid rgba(255, 122, 26, 0.4)',
                      borderRadius: 3, fontFamily: 'inherit', outline: 'none',
                    }} />
                ) : (
                  <h2 onClick={() => setEditingName(true)} title="Clique para renomear"
                    style={{ fontSize: 16, fontWeight: 600, color: '#E6E8EC', margin: 0, lineHeight: 1.3, cursor: 'text' }}>
                    {model.name}
                  </h2>
                )}
                <div style={{ marginTop: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#7A8290', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.file}</div>
              </div>
              <button onClick={onToggleFavorite} title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'} style={{
                width: 28, height: 28, borderRadius: 4, border: 'none',
                background: isFavorite ? 'rgba(255, 168, 95, 0.18)' : 'rgba(255,255,255,0.04)',
                color: isFavorite ? '#FFA85F' : '#9097A0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </button>
              <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 4, border: 'none',
                background: 'rgba(255,255,255,0.04)', color: '#9097A0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name="close" size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
            <SectionLabel style={{ padding: '0 0 10px' }}>Metadados</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '8px 14px', fontSize: 12 }}>
              <KV k="Dimensões" v={model.dims || '—'} mono />
              <KV k="Polígonos" v={(model.polys || 0).toLocaleString('pt-BR')} mono />
              <KV k="Tamanho"   v={model.sizeKB > 1024 ? (model.sizeKB / 1024).toFixed(1) + ' MB' : model.sizeKB + ' KB'} mono />
              <KV k="Adicionado" v={model.date} mono />
              <KV k="Hash"       v={model.hash ? model.hash.slice(0, 12) + '…' : '—'} mono />
            </div>

            <SectionLabel style={{ padding: '18px 0 10px' }}>Etiquetas</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, position: 'relative' }}>
              {(model.tags || []).map(t => (
                <span key={t} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 4px 3px 8px', borderRadius: 3,
                  background: 'rgba(255,255,255,0.04)', color: '#C7CDD5', fontSize: 11,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: tagColors[t] || '#9097A0' }} />
                  {t}
                  {onRemoveTag && (
                    <button onClick={() => onRemoveTag(t)} title="Remover" style={{
                      width: 14, height: 14, padding: 0, marginLeft: 2,
                      border: 'none', background: 'transparent', color: '#5A626C', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2,
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#E6E8EC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5A626C'; }}>
                      <Icon name="close" size={9} strokeWidth={2.2} />
                    </button>
                  )}
                </span>
              ))}
              {onAddTag && (
                <div style={{ position: 'relative' }}>
                  <button onClick={(e) => { e.stopPropagation(); setPickerOpen(o => !o); }} style={tagAddBtn}>
                    <Icon name="plus" size={10} strokeWidth={2.4} /> adicionar
                  </button>
                  {pickerOpen && (
                    <TagPicker
                      allTags={allTags}
                      currentTags={model.tags || []}
                      onAdd={(name) => onAddTag(name)}
                      onClose={() => setPickerOpen(false)}
                    />
                  )}
                </div>
              )}
            </div>

            <SectionLabel style={{ padding: '18px 0 10px' }}>Coleções</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {collections.map((c) => {
                const inIt = c.modelIds.includes(model.id);
                return (
                  <button key={c.id}
                    onClick={() => inIt ? onRemoveFromCollection(c.id) : onAddToCollection(c.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 9px', borderRadius: 4,
                      border: inIt ? '1px solid rgba(255, 122, 26, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                      background: inIt ? 'rgba(255, 122, 26, 0.12)' : 'rgba(255,255,255,0.025)',
                      color: inIt ? '#FFA85F' : '#B4BAC2',
                      fontSize: 11.5, fontFamily: 'inherit', cursor: 'pointer',
                    }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color || '#9097A0' }} />
                    {c.name}
                    {inIt && <Icon name="close" size={9} strokeWidth={2.2} />}
                  </button>
                );
              })}
              {collections.length === 0 && (
                <div style={{ fontSize: 11.5, color: '#5A626C' }}>Crie coleções na barra lateral.</div>
              )}
            </div>

            {confirmingDelete && (
              <div style={{
                marginTop: 18, padding: '11px 12px', borderRadius: 5,
                background: 'rgba(232, 17, 35, 0.08)', border: '1px solid rgba(232, 17, 35, 0.30)',
              }}>
                <div style={{ fontSize: 12, color: '#FF8888', marginBottom: 8 }}>
                  Excluir <b>{model.name}</b>? O arquivo será apagado da biblioteca.
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setConfirmingDelete(false)} style={{ ...footerBtn, height: 26, padding: '0 10px', fontSize: 11.5 }}>
                    Cancelar
                  </button>
                  <button onClick={() => { onDelete?.(); }} style={{
                    ...footerBtn, height: 26, padding: '0 10px', fontSize: 11.5,
                    background: 'rgba(232, 17, 35, 0.15)', borderColor: 'rgba(232, 17, 35, 0.4)', color: '#FF8888',
                  }}>
                    Excluir definitivamente
                  </button>
                </div>
              </div>
            )}
          </div>
          <div style={{
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: 8,
          }}>
            <button style={{ ...footerBtn, flex: 1, background: 'rgba(255, 122, 26, 0.13)', borderColor: 'rgba(255, 122, 26, 0.3)', color: '#FFA85F' }}>
              <Icon name="download" size={13} strokeWidth={1.8} /> Exportar
            </button>
            {onDelete && (
              <button onClick={() => setConfirmingDelete(true)} title="Excluir modelo"
                style={{ ...footerBtn, color: '#9097A0' }}>
                <Icon name="trash" size={13} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
