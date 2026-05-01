import { useState } from 'react';
import { LUMIA_DATA } from '../data.js';
import { Icon, Tag } from './Icons.jsx';
import { Lumia3DLogo, LumiaLabsSignature } from './Logo.jsx';

const SectionLabel = ({ children, style }) => (
  <div style={{
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 9.5, fontWeight: 600, letterSpacing: 1.4,
    textTransform: 'uppercase', color: '#5A626C',
    padding: '6px 10px 8px', ...style,
  }}>{children}</div>
);

const CategoryTree = ({ categories, selectedId, onSelect }) => {
  const [expanded, setExpanded] = useState(new Set(['mech', 'arch']));
  const toggle = (id) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };
  const renderNode = (cat, depth = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expanded.has(cat.id);
    const isSelected = selectedId === cat.id;
    return (
      <div key={cat.id}>
        <div onClick={() => onSelect(cat.id)} className="cat-row" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          paddingLeft: 8 + depth * 14, paddingRight: 8, height: 28,
          borderRadius: 4, cursor: 'pointer',
          background: isSelected ? 'rgba(255, 122, 26, 0.13)' : 'transparent',
          color: isSelected ? '#FFA85F' : '#C7CDD5',
          fontSize: 12.5, transition: 'background 100ms',
        }}>
          <button onClick={(e) => { e.stopPropagation(); if (hasChildren) toggle(cat.id); }} style={{
            width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent', cursor: hasChildren ? 'pointer' : 'default',
            color: '#7A8290', padding: 0, opacity: hasChildren ? 1 : 0,
          }}>
            <Icon name={isExpanded ? 'chevronDown' : 'chevronRight'} size={11} strokeWidth={2} />
          </button>
          <Icon name={isExpanded && hasChildren ? 'folderOpen' : 'folder'} size={13} stroke={isSelected ? '#FFA85F' : '#7A8290'} strokeWidth={1.5} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>{cat.count}</span>
        </div>
        {hasChildren && isExpanded && <div>{cat.children.map(c => renderNode(c, depth + 1))}</div>}
      </div>
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div onClick={() => onSelect(null)} className="cat-row" style={{
        display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 8,
        height: 28, borderRadius: 4, cursor: 'pointer',
        background: selectedId == null ? 'rgba(255, 122, 26, 0.13)' : 'transparent',
        color: selectedId == null ? '#FFA85F' : '#C7CDD5', fontSize: 12.5,
      }}>
        <Icon name="cube" size={13} stroke={selectedId == null ? '#FFA85F' : '#7A8290'} strokeWidth={1.5} />
        <span style={{ flex: 1 }}>Toda a biblioteca</span>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>274</span>
      </div>
      {categories.map(c => renderNode(c))}
    </div>
  );
};

const CollectionRow = ({ icon, label, count, color, active, onClick, onDelete }) => (
  <div onClick={onClick} className="cat-row" style={{
    display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 8,
    height: 28, borderRadius: 4, cursor: 'pointer',
    background: active ? 'rgba(255, 122, 26, 0.13)' : 'transparent',
    color: active ? '#FFA85F' : '#C7CDD5', fontSize: 12.5,
  }}>
    {icon === 'star' ? (
      <svg width="13" height="13" viewBox="0 0 24 24" fill={active ? '#FFA85F' : 'none'} stroke={active ? '#FFA85F' : color || '#7A8290'} strokeWidth="1.6" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ) : (
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color || '#7A8290', flexShrink: 0 }} />
    )}
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C' }}>{count}</span>
    {onDelete && (
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Excluir coleção" style={{
        width: 16, height: 16, border: 'none', background: 'transparent', color: '#5A626C',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      }}>
        <Icon name="close" size={10} strokeWidth={2} />
      </button>
    )}
  </div>
);

export const Sidebar = ({ selectedCat, onSelectCat, activeTags, onToggleTag, collections, favorites, FAV_ID, selectedCollection, onSelectCollection, onCreateCollection, onDeleteCollection }) => {
  const { categories, tags } = LUMIA_DATA;
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const submitDraft = () => {
    const n = draftName.trim();
    if (n) onCreateCollection(n);
    setDraftName(''); setCreating(false);
  };
  return (
    <aside style={{
      width: 248, flexShrink: 0, background: '#16181c',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <Lumia3DLogo size={0.95} />
        <div style={{ marginTop: 10, paddingLeft: 2 }}><LumiaLabsSignature /></div>
      </div>
      <div style={{ padding: '10px 12px 6px' }}>
        <button className="primary-btn" style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '8px 12px',
          background: 'linear-gradient(180deg, #FF8A2E 0%, #E66A0F 100%)',
          color: '#1a0f05', border: '1px solid rgba(255, 138, 46, 0.3)',
          borderRadius: 5, fontWeight: 600, fontSize: 12, cursor: 'pointer',
          boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px rgba(255, 122, 26, 0.2)',
        }}>
          <Icon name="upload" size={13} strokeWidth={2.2} />
          Importar modelos
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 12px' }}>
        <SectionLabel>Categorias</SectionLabel>
        <CategoryTree categories={categories} selectedId={selectedCat} onSelect={onSelectCat} />
        <SectionLabel style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
          <span>Coleções</span>
          <button onClick={() => setCreating(true)} title="Nova coleção" style={{
            width: 16, height: 16, border: 'none', background: 'transparent', color: '#7A8290',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}>
            <Icon name="plus" size={11} strokeWidth={2.2} />
          </button>
        </SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <CollectionRow
            icon="star" label="Favoritos" count={favorites.length}
            active={selectedCollection === FAV_ID}
            onClick={() => onSelectCollection(selectedCollection === FAV_ID ? null : FAV_ID)} />
          {collections.map((c) => (
            <CollectionRow key={c.id} label={c.name} count={c.modelIds.length} color={c.color}
              active={selectedCollection === c.id}
              onClick={() => onSelectCollection(selectedCollection === c.id ? null : c.id)}
              onDelete={() => onDeleteCollection(c.id)} />
          ))}
          {creating && (
            <div style={{ padding: '4px 8px' }}>
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={submitDraft}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitDraft();
                  if (e.key === 'Escape') { setDraftName(''); setCreating(false); }
                }}
                placeholder="Nome da coleção…"
                style={{
                  width: '100%', height: 26, padding: '0 8px',
                  background: '#0f1115', border: '1px solid rgba(255, 122, 26, 0.4)',
                  borderRadius: 4, color: '#E6E8EC', fontSize: 12, fontFamily: 'inherit', outline: 'none',
                }} />
            </div>
          )}
        </div>
        <SectionLabel style={{ marginTop: 18 }}>Etiquetas</SectionLabel>
        <div style={{ padding: '4px 6px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {tags.map(t => (
            <Tag key={t.name} name={t.name} color={t.color} count={t.count}
              active={activeTags.has(t.name)} onClick={() => onToggleTag(t.name)} />
          ))}
        </div>
      </div>
      <div style={{
        padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)',
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>274 obj · 1.84 GB</span>
        <span style={{ color: '#5BD68D' }}>● indexado</span>
      </div>
    </aside>
  );
};

export { SectionLabel };
