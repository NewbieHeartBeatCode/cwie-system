import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { ROLES } from '@/utils/labels'
import { brand } from '@/styles/theme'
import { pretestRole } from '@/services/api'
import { initialOf } from '@/utils/format'
import Chip from '@/components/common/Chip'

export default function Navbar({ title, onMenu }) {
  const { t, isDark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const iconBtn = { width: 40, height: 40, borderRadius: 10, border: `1px solid ${t.line}`, background: t.surface2, color: t.ink, cursor: 'pointer', display: 'grid', placeItems: 'center' }

  return (
    <header className="no-print"
      style={{ height: 62, background: t.surface, borderBottom: `1px solid ${t.line}`,
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', flexShrink: 0 }}>
      <button onClick={onMenu} id="menuBtn"
        style={{ display: 'none', background: 'none', border: 'none', color: t.ink, cursor: 'pointer' }}>
        <Menu size={22} />
      </button>
      <div style={{ fontWeight: 600, fontSize: 15.5 }}>{title}</div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {pretestRole && <Chip tone="warn">โหมดทดสอบ</Chip>}
        <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{user.fullName}</div>
          <div style={{ fontSize: 12, color: t.muted }}>{ROLES[user.role]}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: brand.oxblood, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>
          {initialOf(user.fullName)}
        </div>
        <button onClick={toggle} title="สลับโหมดสว่าง/มืด" style={iconBtn}>
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button onClick={logout} title="ออกจากระบบ" style={iconBtn}>
          <LogOut size={19} />
        </button>
      </div>
    </header>
  )
}
