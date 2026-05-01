import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LUMIA_DATA } from '../data.js';
import { Icon, FormatBadge, Tag } from './Icons.jsx';
import { SectionLabel } from './Sidebar.jsx';
import { buildProcedural, matClay } from '../three/procedural.js';
import { loadModel } from '../three/loaders.js';

const ThreeViewer = ({ model }) => {
  const ref = useRef(null);
  const stateRef = useRef({});
  const [loading, setLoading] = useState(false);

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

    // Holder swapped in/out depending on whether a real model URL loads.
    let obj = buildProcedural(model.shape);
    scene.add(obj);

    // If the model has a real URL, try loading it asynchronously.
    // On success, swap out the procedural placeholder.
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
        .catch((err) => {
          console.warn('[Lumia3D] failed to load', model.url, err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    let raf;
    let auto = true;
    const start = performance.now();

    const onPointerDown = (e) => {
      auto = false;
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
      if (auto && obj) obj.rotation.y = (performance.now() - start) * 0.0005;
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

const KV = ({ k, v, mono }) => (
  <>
    <div style={{ color: '#7A8290', fontSize: 11.5 }}>{k}</div>
    <div style={{ color: '#E6E8EC', fontSize: 11.5, fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit' }}>{v}</div>
  </>
);

const ViewerBtn = ({ icon, label }) => (
  <button style={{
    height: 28, padding: label ? '0 10px' : '0', minWidth: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 4, color: '#C7CDD5', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
  }}>
    <Icon name={icon} size={12} strokeWidth={1.7} />
    {label}
  </button>
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

export const ModelDetail = ({ model, onClose, isFavorite, onToggleFavorite, collections = [], onAddToCollection, onRemoveFromCollection }) => {
  if (!model) return null;
  const tagColors = Object.fromEntries(LUMIA_DATA.tags.map(t => [t.name, t.color]));
  const inCollections = collections.filter((c) => c.modelIds.includes(model.id));
  const cat = (() => {
    for (const c of LUMIA_DATA.categories) {
      if (c.id === model.cat) return c.name;
      if (c.children) for (const cc of c.children) if (cc.id === model.cat) return c.name + ' / ' + cc.name;
    }
    return '—';
  })();

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
            <ThreeViewer model={model} />
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
              <FormatBadge format={model.format} />
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'rgba(0,0,0,0.5)', color: '#9097A0', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(model.polys / 1000).toFixed(0)}k tris
              </span>
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 6 }}>
              <ViewerBtn icon="rotate" label="Auto" />
              <ViewerBtn icon="grid" />
              <ViewerBtn icon="sun" />
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
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#E6E8EC', margin: 0, lineHeight: 1.3 }}>{model.name}</h2>
                <div style={{ marginTop: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#7A8290' }}>{model.file}</div>
              </div>
              <button onClick={onToggleFavorite} title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'} style={{
                width: 28, height: 28, borderRadius: 4, border: 'none',
                background: isFavorite ? 'rgba(255, 168, 95, 0.18)' : 'rgba(255,255,255,0.04)',
                color: isFavorite ? '#FFA85F' : '#9097A0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </button>
              <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 4, border: 'none',
                background: 'rgba(255,255,255,0.04)', color: '#9097A0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="close" size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
            <SectionLabel style={{ padding: '0 0 10px' }}>Metadados</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '8px 14px', fontSize: 12 }}>
              <KV k="Categoria" v={cat} />
              <KV k="Dimensões" v={model.dims} mono />
              <KV k="Polígonos" v={model.polys.toLocaleString('pt-BR')} mono />
              <KV k="Tamanho" v={model.sizeKB > 1024 ? (model.sizeKB / 1024).toFixed(1) + ' MB' : model.sizeKB + ' KB'} mono />
              <KV k="Adicionado" v={model.date} mono />
              <KV k="Hash" v={model.hash} mono />
            </div>
            <SectionLabel style={{ padding: '18px 0 10px' }}>Etiquetas</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {model.tags.map(t => <Tag key={t} name={t} color={tagColors[t]} />)}
              <button style={tagAddBtn}><Icon name="plus" size={10} strokeWidth={2.4} /> adicionar</button>
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
            <SectionLabel style={{ padding: '18px 0 10px' }}>Anexos · {model.attachments}</SectionLabel>
            {model.attachments > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { name: 'render_studio_a.png', icon: 'image', size: '1.2 MB' },
                  { name: 'print_settings.gcode', icon: 'code', size: '342 KB' },
                  { name: 'instrucoes_montagem.pdf', icon: 'pdf', size: '88 KB' },
                  { name: 'fotos_protótipo.zip', icon: 'file', size: '4.8 MB' },
                  { name: 'notas.md', icon: 'file', size: '2 KB' },
                ].slice(0, model.attachments).map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 10px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)',
                    fontSize: 11.5,
                  }}>
                    <Icon name={a.icon} size={13} stroke="#7A8290" strokeWidth={1.6} />
                    <span style={{ flex: 1, color: '#C7CDD5', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>{a.name}</span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>{a.size}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 0', fontSize: 11.5, color: '#5A626C' }}>Nenhum anexo associado.</div>
            )}
            {model.dup && (
              <div style={{
                marginTop: 18, padding: '11px 12px', borderRadius: 5,
                background: 'rgba(245, 192, 74, 0.08)', border: '1px solid rgba(245, 192, 74, 0.25)',
                display: 'flex', gap: 10,
              }}>
                <Icon name="duplicate" size={14} stroke="#F5C04A" strokeWidth={1.7} />
                <div style={{ fontSize: 11.5, color: '#F5C04A', lineHeight: 1.5 }}>
                  Hash quase idêntico ao modelo <b>#{model.dup}</b>. Pode ser uma versão anterior do mesmo objeto.
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
            <button style={footerBtn}><Icon name="paperclip" size={13} strokeWidth={1.8} /></button>
            <button style={footerBtn}><Icon name="settings" size={13} strokeWidth={1.8} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
