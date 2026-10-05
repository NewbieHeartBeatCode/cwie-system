import { useTheme } from '@/context/ThemeContext'
import { brand } from '@/styles/theme'
import { ROLES } from '@/utils/labels'
import { formatDateTime } from '@/utils/format'

// ประวัติขั้นตอน (ใครทำอะไรเมื่อไร) ของเอกสาร / การออกฝึก
export default function Timeline({ items = [] }) {
  const { t } = useTheme()
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((h, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < items.length - 1 ? 14 : 0, position: 'relative' }}>
          <div style={{ width: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: i === items.length - 1 ? brand.oxblood : t.line, marginTop: 5 }} />
            {i < items.length - 1 && <span style={{ flex: 1, width: 2, background: t.line, marginTop: 3 }} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{h.action}</div>
            <div style={{ fontSize: 12.5, color: t.muted }}>{h.byName} · {ROLES[h.role] || h.role} · {formatDateTime(h.at)}</div>
            {h.note && <div style={{ fontSize: 13.5, marginTop: 4, padding: '6px 10px', background: t.surface2, borderRadius: 8, border: `1px solid ${t.line}` }}>{h.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
