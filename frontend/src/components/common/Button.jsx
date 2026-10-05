import { useTheme } from '@/context/ThemeContext'
import { brand } from '@/styles/theme'

// ปุ่มกลางของระบบ: primary (แดง), secondary (ขอบ), danger, ghost
export default function Button({ variant = 'primary', icon: Icon, small, children, style, ...props }) {
  const { t } = useTheme()
  const v = {
    primary:   { background: brand.oxblood, color: '#fff', border: 'none' },
    secondary: { background: t.surface, color: t.ink, border: `1px solid ${t.line}` },
    danger:    { background: 'transparent', color: brand.bright, border: `1px solid ${brand.bright}66` },
    ghost:     { background: 'transparent', color: brand.bright, border: 'none' },
  }[variant]
  return (
    <button className="press" {...props}
      style={{ ...v, display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center',
        padding: small ? '6px 11px' : '9px 15px', borderRadius: 9, fontSize: small ? 13 : 14, fontWeight: 600,
        cursor: props.disabled ? 'default' : 'pointer', opacity: props.disabled ? 0.55 : 1, whiteSpace: 'nowrap', ...style }}>
      {Icon && <Icon size={small ? 15 : 17} />}{children}
    </button>
  )
}
