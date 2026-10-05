import { useTheme } from '@/context/ThemeContext'
import { brand } from '@/styles/theme'

export default function PageHeader({ title, subtitle, actions }) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>
        {subtitle && <p style={{ margin: '6px 0 0', color: t.muted, fontSize: 14.5 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}

// ข้อความโหลด / error / ว่าง ใช้ร่วมกันทุกหน้า
export function Status({ loading, error, empty, children }) {
  const { t } = useTheme()
  const box = { padding: '28px 20px', textAlign: 'center', color: t.muted, fontSize: 14 }
  if (loading) return <div style={box}>กำลังโหลด...</div>
  if (error) return <div style={{ ...box, color: brand.bright }}>{error}</div>
  if (empty) return <div style={box}>{empty}</div>
  return children
}

export function ErrorText({ children }) {
  if (!children) return null
  return (
    <div role="alert" style={{ background: '#A3162114', color: brand.bright, border: '1px solid #A3162140', borderRadius: 9, padding: '9px 12px', fontSize: 13.5 }}>
      {children}
    </div>
  )
}
