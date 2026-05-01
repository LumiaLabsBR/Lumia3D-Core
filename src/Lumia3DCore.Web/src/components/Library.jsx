import { LUMIA_DATA } from '../data.js';
import { Icon, FormatBadge } from './Icons.jsx';
import { ModelThumbnail } from './Thumbnails.jsx';

const ModelCard = ({ model, onOpen, large }) => {
  const tagColors = Object.fromEntries(LUMIA_DATA.tags.map(t => [t.name, t.color]));
  return (
    <div onClick={() => onOpen(model)} className="model-card" style={{
      background: '#1a1c20', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
      transition: 'transform 140ms, border-color 140ms, box-shadow 140ms',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden' }}>
        <ModelThumbnail shape={model.shape} modelId={model.id} />
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <FormatBadge format={model.format} />
        </div>
        {model.dup && (
          <div title={`Possível duplicado de #${model.dup}`} style={{
            position: 'absolute', top: 8, right: 8,
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
          {model.tags.slice(0, 3).map(t => (
            <span key={t} style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 3,
              background: 'rgba(255,255,255,0.04)', color: '#9097A0',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: tagColors[t] || '#9097A0' }} />
              {t}
            </span>
          ))}
          {model.tags.length > 3 && <span style={{ fontSize: 10, color: '#5A626C', alignSelf: 'center' }}>+{model.tags.length - 3}</span>}
        </div>
      </div>
    </div>
  );
};

const ModelListRow = ({ model, onOpen }) => {
  const tagColors = Object.fromEntries(LUMIA_DATA.tags.map(t => [t.name, t.color]));
  return (
    <div onClick={() => onOpen(model)} className="list-row" style={{
      display: 'grid', gridTemplateColumns: '60px 1.6fr 0.8fr 0.6fr 0.5fr 0.5fr 0.4fr',
      alignItems: 'center', gap: 14, padding: '8px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
      fontSize: 12, color: '#C7CDD5',
    }}>
      <div style={{ width: 52, height: 40, borderRadius: 4, overflow: 'hidden', background: '#0f1115' }}>
        <ModelThumbnail shape={model.shape} modelId={model.id} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
        <span style={{ fontWeight: 500, color: '#E6E8EC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.name}</span>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>{model.file}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {model.tags.slice(0, 2).map(t => (
          <span key={t} style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 3,
            background: 'rgba(255,255,255,0.04)', color: '#9097A0',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: tagColors[t] || '#9097A0' }} />{t}
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
};

export const Library = ({ models, view, onOpen }) => {
  if (models.length === 0) {
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
  if (view === 'list') {
    return (
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '60px 1.6fr 0.8fr 0.6fr 0.5fr 0.5fr 0.4fr',
          gap: 14, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, fontWeight: 600,
          letterSpacing: 1.2, textTransform: 'uppercase', color: '#5A626C',
          background: '#15171b', position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div></div>
          <div>Nome</div>
          <div>Etiquetas</div>
          <div>Formato</div>
          <div>Dimensões</div>
          <div>Tamanho</div>
          <div style={{ textAlign: 'right' }}>Data</div>
        </div>
        {models.map(m => <ModelListRow key={m.id} model={m} onOpen={onOpen} />)}
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {models.map(m => <ModelCard key={m.id} model={m} onOpen={onOpen} large />)}
      </div>
    </div>
  );
};
