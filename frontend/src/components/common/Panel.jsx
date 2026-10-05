import { useTheme } from '@/context/ThemeContext'

export default function Panel({ children, style, className }) {
  const { t } = useTheme()
  return (
    <div className={className}
      style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, boxShadow: t.shadow, ...style }}>
      {children}
    </div>
  )
}
