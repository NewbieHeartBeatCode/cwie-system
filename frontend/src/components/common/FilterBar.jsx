import { Search } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

// แถบค้นหา + ตัวกรอง (select) ด้านบนตาราง
// filters = [{ key, label, value, options: [{ value, label }] }]
export default function FilterBar({ search, onSearch, filters = [], onFilter }) {
  const { t } = useTheme()
  const box = { background: t.surface, color: t.ink, border: `1px solid ${t.line}`, borderRadius: 9, padding: '9px 11px', fontSize: 14 }
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      {onSearch && (
        <label style={{ ...box, display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 220px', maxWidth: 360 }}>
          <Search size={17} color={t.muted} />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="ค้นหา..." aria-label="ค้นหา"
            style={{ border: 'none', outline: 'none', background: 'transparent', color: t.ink, fontSize: 14, width: '100%' }} />
        </label>
      )}
      {filters.map((f) => (
        <select key={f.key} value={f.value} onChange={(e) => onFilter(f.key, e.target.value)} aria-label={f.label} style={box}>
          <option value="">{f.label}: ทั้งหมด</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
    </div>
  )
}

// ตัวกรองเก็บใน URL (?status=...) จะได้กดลิงก์จากแดชบอร์ดมาแล้วกรองให้เลย
export function useUrlFilters(searchParams, setSearchParams) {
  const get = (key) => searchParams.get(key) || ''
  const set = (key, value) => {
    const next = new URLSearchParams(searchParams)
    value ? next.set(key, value) : next.delete(key)
    setSearchParams(next, { replace: true })
  }
  return { get, set }
}

// ค้นหาแบบไม่สนตัวพิมพ์ในหลาย field
export const matches = (q, ...values) => !q || values.some((v) => String(v ?? '').toLowerCase().includes(q.toLowerCase()))
