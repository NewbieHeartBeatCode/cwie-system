import { useTheme } from '@/context/ThemeContext'
import { brand } from '@/styles/theme'

// แถบความคืบหน้า เช่น สัปดาห์ที่ปฏิบัติงาน
export default function ProgressBar({ pct, label, width = 140 }) {
  const { t } = useTheme()
  return (
    <div style={{ width }}>
      {label && <div style={{ fontSize: 11.5, color: t.muted, marginBottom: 4 }}>{label}</div>}
      <div style={{ height: 7, background: t.line, borderRadius: 99 }}>
        <div style={{ width: Math.min(100, Math.max(0, pct)) + '%', height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${brand.oxblood}, ${brand.bright})` }} />
      </div>
    </div>
  )
}
