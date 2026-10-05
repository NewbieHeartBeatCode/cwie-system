import { GraduationCap } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { brand } from '@/styles/theme'

// กรอบหน้า login/สมัคร ใช้ร่วมกัน
export default function AuthShell({ subtitle, children }) {
  const { t } = useTheme()

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.ink, display: 'grid', placeItems: 'center', padding: 16,
      fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 16, padding: 28, boxShadow: t.shadow }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: brand.oxblood, color: '#fff', display: 'grid', placeItems: 'center' }}>
            <GraduationCap size={28} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>ระบบสหกิจศึกษา CWIE</div>
            <div style={{ fontSize: 13, color: t.muted }}>{subtitle}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

// ปุ่มหลัก + ข้อความ error + ลิงก์สลับหน้า ใช้ซ้ำทั้งสองหน้า
export function SubmitButton({ busy, children }) {
  return (
    <button type="submit" className="press" disabled={busy}
      style={{ padding: '12px', borderRadius: 10, border: 'none', background: brand.oxblood, color: '#fff', fontSize: 15, fontWeight: 600,
        cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, marginTop: 4 }}>
      {children}
    </button>
  )
}

export { ErrorText } from '@/components/common/PageHeader'

export function SwitchLink({ text, action, onClick }) {
  const { t } = useTheme()
  return (
    <div style={{ textAlign: 'center', fontSize: 13.5, color: t.muted }}>
      {text}{' '}
      <button type="button" onClick={onClick}
        style={{ background: 'none', border: 'none', padding: 0, color: brand.bright, fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}>
        {action}
      </button>
    </div>
  )
}
