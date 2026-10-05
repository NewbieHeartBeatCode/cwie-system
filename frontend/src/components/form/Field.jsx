import { useTheme } from '@/context/ThemeContext'

export function Field({ label, children }) {
  const { t } = useTheme()
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 13, color: t.muted, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {children}
    </label>
  )
}

// style กลางของ input/select/textarea ให้หน้าตาเหมือนกันทั้งระบบ
export function inputStyle(t) {
  return { width: '100%', padding: '10px 12px', borderRadius: 9,
    border: `1px solid ${t.line}`, background: t.surface2, color: t.ink, fontSize: 14 }
}
