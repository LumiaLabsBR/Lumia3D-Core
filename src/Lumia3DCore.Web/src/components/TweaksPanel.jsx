import { Icon } from './Icons.jsx';

const Section = ({ title, children }) => (
  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 9.5, fontWeight: 600, letterSpacing: 1.4,
      textTransform: 'uppercase', color: '#5A626C', marginBottom: 10,
    }}>{title}</div>
    {children}
  </div>
);

const Radio = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', background: '#0f1115', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: 2 }}>
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)} style={{
        flex: 1, height: 26, border: 'none', borderRadius: 3,
        background: value === o.value ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: value === o.value ? '#E6E8EC' : '#7A8290',
        fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit',
      }}>{o.label}</button>
    ))}
  </div>
);

export const TweaksPanel = ({ tweaks, setTweaks, onReset, onClose }) => {
  const set = (patch) => setTweaks({ ...tweaks, ...patch });
  return (
    <div style={{
      position: 'absolute', top: 50, right: 14, zIndex: 60,
      width: 280, background: '#16181c',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7,
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      animation: 'slideUp 160ms ease-out',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Icon name="sliders" size={12} stroke="#FFA85F" strokeWidth={1.8} />
        <span style={{ marginLeft: 8, flex: 1, fontSize: 12, fontWeight: 600, color: '#E6E8EC' }}>Tweaks</span>
        <button onClick={onClose} style={{
          width: 22, height: 22, border: 'none', background: 'transparent',
          color: '#7A8290', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="close" size={12} strokeWidth={2} />
        </button>
      </div>
      <Section title="Tema">
        <Radio
          value={tweaks.theme}
          onChange={(v) => set({ theme: v })}
          options={[
            { value: 'dark', label: 'Escuro' },
            { value: 'light', label: 'Claro' },
            { value: 'contrast', label: 'Alto contraste' },
          ]}
        />
      </Section>
      <Section title="Densidade">
        <Radio
          value={tweaks.density}
          onChange={(v) => set({ density: v })}
          options={[
            { value: 'compact', label: 'Compacta' },
            { value: 'comfortable', label: 'Confortável' },
          ]}
        />
      </Section>
      <Section title="Visualização padrão">
        <Radio
          value={tweaks.defaultView}
          onChange={(v) => set({ defaultView: v })}
          options={[
            { value: 'gallery', label: 'Galeria' },
            { value: 'list', label: 'Lista' },
          ]}
        />
      </Section>
      <div style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#5A626C',
      }}>
        <span style={{ flex: 1 }}>persistido em localStorage</span>
        <button onClick={onReset} style={{
          padding: '3px 8px', borderRadius: 3,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
          color: '#9097A0', fontSize: 10, fontFamily: 'inherit', cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: 0.6,
        }}>resetar</button>
      </div>
    </div>
  );
};
