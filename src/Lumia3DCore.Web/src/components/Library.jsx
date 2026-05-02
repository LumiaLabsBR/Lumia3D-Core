import { useMemo } from 'react';
import { LUMIA_DATA } from '../data.js';
import { Icon, FormatBadge } from './Icons.jsx';
import { ModelThumbnail } from './Thumbnails.jsx';
import { useVirtualGrid } from '../hooks/useVirtualGrid.js';

const TAG_COLORS = Object.fromEntries(LUMIA_DATA.tags.map((t) => [t.name, t.color]));

const FavStar = ({ active, onClick }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} title={active ? 'Remover dos favoritos' : 'Favoritar'} style={{
    width: 26, height: 26, border: 'none', borderRadius: 4,
    background: active ? 'rgba(255, 168, 95, 0.22)' : 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    color: active ? '#FFA85F' : '#C7CDD5',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  }}>
    <svg width="13" height="13" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  </button>
);

const ModelCard = ({ model, onOpen, large, isFav, onToggleFav }) => (
  <div onClick={() => onOpen(model)} className="model-card" style={{
    background: '#1a1c20', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
    transition: 'transform 140ms, border-color 140ms, box-shadow 140ms',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden' }}>
      <ModelThumbnail shape={model.shape} modelId={model.id} thumbnailUrl={model.thumbnailUrl} />
      <div style={{ position: 'absolute', top: 8, left: 8 }}>
        <FormatBadge format={model.format} />
      </div>
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
        {model.dup && (
          <div title={`Possível duplicado de #${model.dup}`} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 6px', borderRadius: 3,
            background: 'rgba(245, 192, 74, 0.18)', color: '#F5C04A',
            fontSize: 9.5, fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600,
            border: '1px solid rgba(245, 192, 74, 0.3)',
          }}>
            <Icon name="duplicate" size={10} strokeWidth={2} /> dup
          </div>
        )}
        <FavStar active={isFav} onClick={onToggleFav} />
      </div>
      {model.attachments > 0 && (
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '2px 6px', borderRadius: 3,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          color: '#C7CDD5', fontSize: 10, fontFamily: '"JetBrains Mono", monospace',
        }}>
          <Icon name="paperclip" size={9.5} strokeWidth={2} /> {model.attachments}
        </div>
      )}
    </div>
    <div style={{ padding: large ? '12px 14px 14px' : '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: large ? 13.5 : 12.5, fontWeight: 500, color: '#E6E8EC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>
        <span>{model.dims}</span>
        <span style={{ width: 2, height: 2, background: '#3F4550', borderRadius: '50%' }} />
        <span>{(model.polys / 1000).toFixed(0)}k tris</span>
        <span style={{ width: 2, height: 2, background: '#3F4550', borderRadius: '50%' }} />
        <span>{model.sizeKB > 1024 ? (model.sizeKB / 1024).toFixed(1) + ' MB' : model.sizeKB + ' KB'}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
        {model.tags.slice(0, 3).map((t) => (
          <span key={t} style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 3,
            background: 'rgba(255,255,255,0.04)', color: '#9097A0',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: TAG_COLORS[t] || '#9097A0' }} />
            {t}
          </span>
        ))}
        {model.tags.length > 3 && <span style={{ fontSize: 10, color: '#5A626C', alignSelf: 'center' }}>+{model.tags.length - 3}</span>}
      </div>
    </div>
  </div>
);

const ModelListRow = ({ model, onOpen, isFav, onToggleFav, style }) => (
  <div onClick={() => onOpen(model)} className="list-row" style={{
    display: 'grid', gridTemplateColumns: '32px 60px 1.6fr 0.8fr 0.6fr 0.5fr 0.5fr 0.4fr',
    alignItems: 'center', gap: 14, padding: '8px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
    fontSize: 12, color: '#C7CDD5',
    ...style,
  }}>
    <FavStar active={isFav} onClick={onToggleFav} />
    <div style={{ width: 52, height: 40, borderRadius: 4, overflow: 'hidden', background: '#0f1115' }}>
      <ModelThumbnail shape={model.shape} modelId={model.id} thumbnailUrl={model.thumbnailUrl} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
      <span style={{ fontWeight: 500, color: '#E6E8EC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.name}</span>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>{model.file}</span>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {model.tags.slice(0, 2).map((t) => (
        <span key={t} style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 3,
          background: 'rgba(255,255,255,0.04)', color: '#9097A0',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: TAG_COLORS[t] || '#9097A0' }} />{t}
        </span>
      ))}
    </div>
    <div><FormatBadge format={model.format} /></div>
    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: '#9097A0' }}>{model.dims}</div>
    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: '#9097A0' }}>
      {model.sizeKB > 1024 ? (model.sizeKB / 1024).toFixed(1) + ' MB' : model.sizeKB + ' KB'}
    </div>
    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, color: '#5A626C', textAlign: 'right' }}>
      {model.date.slice(5)}
    </div>
  </div>
);

const VIRTUAL_THRESHOLD = 60; // virtualize lists/grids beyond this size
const CARD_ROW_HEIGHT = 320;
const LIST_ROW_HEIGHT = 56;

const VirtualGalleryGrid = ({ models, onOpen, isFavorite, toggleFavorite }) => {
  // Estimate columns from container width — simple breakpoints.
  const columns = useMemo(() => {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth - 248; // sidebar
    return Math.max(1, Math.floor((w - 40) / 280));
  }, []);
  const { containerRef, totalHeight, offsetY, visible } = useVirtualGrid({
    count: models.length,
    rowHeight: CARD_ROW_HEIGHT,
    columns,
    overscan: 2,
  });
  return (
    <div ref={containerRef} style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: offsetY, left: 0, right: 0,
          display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 16,
        }}>
          {visible.map(({ index }) => {
            const m = models[index];
            return (
              <ModelCard key={m.id} model={m} onOpen={onOpen} large
                isFav={isFavorite(m.id)} onToggleFav={() => toggleFavorite(m.id)} />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const VirtualList = ({ models, onOpen, isFavorite, toggleFavorite }) => {
  const { containerRef, totalHeight, offsetY, visible } = useVirtualGrid({
    count: models.length, rowHeight: LIST_ROW_HEIGHT, columns: 1, overscan: 6,
  });
  return (
    <div ref={containerRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '32px 60px 1.6fr 0.8fr 0.6fr 0.5fr 0.5fr 0.4fr',
        gap: 14, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, fontWeight: 600,
        letterSpacing: 1.2, textTransform: 'uppercase', color: '#5A626C',
        background: '#15171b', position: 'sticky', top: 0, zIndex: 1,
      }}>
        <div></div>
        <div></div>
        <div>Nome</div>
        <div>Etiquetas</div>
        <div>Formato</div>
        <div>Dimensões</div>
        <div>Tamanho</div>
        <div style={{ textAlign: 'right' }}>Data</div>
      </div>
      <div style={{ position: 'relative', height: totalHeight }}>
        {visible.map(({ index }) => {
          const m = models[index];
          return (
            <ModelListRow key={m.id} model={m} onOpen={onOpen}
              isFav={isFavorite(m.id)}
              onToggleFav={() => toggleFavorite(m.id)}
              style={{ position: 'absolute', top: index * LIST_ROW_HEIGHT, left: 0, right: 0, height: LIST_ROW_HEIGHT }} />
          );
        })}
      </div>
    </div>
  );
};

export const Library = ({ models, view, onOpen, isFavorite, toggleFavorite, onImport, isFiltered }) => {
  if (models.length === 0) {
    if (isFiltered) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A626C' }}>
          <div style={{ textAlign: 'center' }}>
            <Icon name="search" size={28} stroke="#3F4550" strokeWidth={1.4} />
            <div style={{ marginTop: 10, fontSize: 13 }}>Nenhum modelo encontrado.</div>
            <div style={{ marginTop: 4, fontSize: 11, color: '#3F4550' }}>Tente outros termos ou limpe os filtros.</div>
          </div>
        </div>
      );
    }
    // Biblioteca vazia (sem filtros): CTA pra importar
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center', padding: 40, borderRadius: 8,
          border: '2px dashed rgba(255, 122, 26, 0.2)', maxWidth: 440,
        }}>
          <Icon name="upload" size={40} stroke="#FF7A1A" strokeWidth={1.2} />
          <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: '#E6E8EC' }}>
            Sua biblioteca está vazia
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, color: '#9097A0', lineHeight: 1.55 }}>
            Arraste arquivos <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#FFA85F' }}>.stl</span>,{' '}
            <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#FFA85F' }}>.obj</span> ou{' '}
            <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#FFA85F' }}>.3mf</span> aqui,
            <br />ou clique no botão abaixo.
          </div>
          {onImport && (
            <button onClick={onImport} style={{
              marginTop: 20, padding: '10px 20px',
              background: 'linear-gradient(180deg, #FF8A2E 0%, #E66A0F 100%)',
              color: '#1a0f05', border: '1px solid rgba(255, 138, 46, 0.3)',
              borderRadius: 5, fontWeight: 600, fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(255, 122, 26, 0.2)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name="upload" size={13} strokeWidth={2.2} />
              Importar modelos
            </button>
          )}
        </div>
      </div>
    );
  }
  const useVirtual = models.length > VIRTUAL_THRESHOLD;

  if (view === 'list') {
    if (useVirtual) return <VirtualList models={models} onOpen={onOpen} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />;
    return (
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '32px 60px 1.6fr 0.8fr 0.6fr 0.5fr 0.5fr 0.4fr',
          gap: 14, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, fontWeight: 600,
          letterSpacing: 1.2, textTransform: 'uppercase', color: '#5A626C',
          background: '#15171b', position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div></div>
          <div></div>
          <div>Nome</div>
          <div>Etiquetas</div>
          <div>Formato</div>
          <div>Dimensões</div>
          <div>Tamanho</div>
          <div style={{ textAlign: 'right' }}>Data</div>
        </div>
        {models.map((m) => (
          <ModelListRow key={m.id} model={m} onOpen={onOpen}
            isFav={isFavorite(m.id)} onToggleFav={() => toggleFavorite(m.id)} />
        ))}
      </div>
    );
  }
  if (useVirtual) return <VirtualGalleryGrid models={models} onOpen={onOpen} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />;
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {models.map((m) => (
          <ModelCard key={m.id} model={m} onOpen={onOpen} large
            isFav={isFavorite(m.id)} onToggleFav={() => toggleFavorite(m.id)} />
        ))}
      </div>
    </div>
  );
};
