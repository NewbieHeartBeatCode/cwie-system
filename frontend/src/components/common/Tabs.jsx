import { useTheme } from '@/context/ThemeContext'
import { brand } from '@/styles/theme'

// tabs = [{ key, label, count? }]
export default function Tabs({ tabs, value, onChange }) {
  const { t } = useTheme()
  return (
    <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${t.line}`, overflowX: 'auto', marginBottom: 16 }}>
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <button key={tab.key} role="tab" aria-selected={active} onClick={() => onChange(tab.key)}
            style={{ background: 'none', border: 'none', borderBottom: `2px solid ${active ? brand.oxblood : 'transparent'}`,
              color: active ? t.ink : t.muted, fontWeight: active ? 600 : 500, fontSize: 14, padding: '10px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {tab.label}{tab.count !== undefined && <span style={{ color: t.muted, fontWeight: 500 }}> ({tab.count})</span>}
          </button>
        )
      })}
    </div>
  )
}
