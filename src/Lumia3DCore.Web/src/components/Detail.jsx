import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LUMIA_DATA } from '../data.js';
import { Icon, FormatBadge, Tag } from './Icons.jsx';
import { SectionLabel } from './Sidebar.jsx';

const ThreeViewer = ({ shape }) => {
  const ref = useRef(null);
  const stateRef = useRef({});

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

    const matClay = new THREE.MeshStandardMaterial({ color: 0xc4c8ce, roughness: 0.55, metalness: 0.1 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xb0b6be, roughness: 0.25, metalness: 0.85 });

    let mesh;
    const group = new THREE.Group();

    const buildShape = () => {
      switch (shape) {
        case 'gear': {
          const teeth = 16;
          for (let i = 0; i < teeth; i++) {
            const t = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.5), matMetal);
            const a = (i / teeth) * Math.PI * 2;
            t.position.set(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0);
            t.rotation.y = -a;
            t.castShadow = true;
            group.add(t);
          }
          const body = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.45, 48), matMetal);
          body.castShadow = true; group.add(body);
          const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 1 }));
          group.add(hole);
          return group;
        }
        case 'torus':
          mesh = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.32, 24, 60), matMetal);
          mesh.rotation.x = Math.PI / 2;
          break;
        case 'cube':
          mesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), matClay);
          break;
        case 'ring': {
          const r = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.16, 20, 60), matMetal);
          r.rotation.x = Math.PI / 2;
          r.castShadow = true; group.add(r);
          const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshStandardMaterial({ color: 0xb8e0ff, roughness: 0.05, metalness: 0.2 }));
          gem.position.y = 0.25;
          gem.castShadow = true; group.add(gem);
          return group;
        }
        case 'vase': {
          const points = [];
          for (let i = 0; i <= 12; i++) {
            const t = i / 12;
            const r = 0.3 + Math.sin(t * Math.PI) * 0.55 + (1 - t) * 0.1;
            points.push(new THREE.Vector2(r, t * 1.8 - 0.9));
          }
          mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 48), matClay);
          break;
        }
        case 'skull':
        case 'bust':
        case 'figure': {
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 24), matClay);
          head.position.y = 0.35;
          head.castShadow = true; group.add(head);
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.0, 24), matClay);
          body.position.y = -0.5;
          body.castShadow = true; group.add(body);
          return group;
        }
        case 'box':
          mesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.2), matClay);
          break;
        case 'screw': {
          const head = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.18, 24), matMetal);
          head.position.y = 0.85;
          head.castShadow = true; group.add(head);
          const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.5, 16), matMetal);
          shaft.castShadow = true; group.add(shaft);
          return group;
        }
        case 'hex': {
          const positions = [[0, 0], [1.6, 0], [-1.6, 0], [0.8, 1.1], [-0.8, 1.1], [0.8, -1.1], [-0.8, -1.1]];
          positions.forEach(([x, z]) => {
            const hh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.4, 6), matClay);
            hh.position.set(x, 0, z);
            hh.castShadow = true; group.add(hh);
          });
          return group;
        }
        default:
          mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), matClay);
      }
      mesh.castShadow = true;
      group.add(mesh);
      return group;
    };

    const obj = buildShape();
    scene.add(obj);

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
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (auto) obj.rotation.y = (performance.now() - start) * 0.0005;
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
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [shape]);

  return <div ref={ref} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
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

export const ModelDetail = ({ model, onClose }) => {
  if (!model) return null;
  const tagColors = Object.fromEntries(LUMIA_DATA.tags.map(t => [t.name, t.color]));
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
            <ThreeViewer shape={model.shape} />
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
