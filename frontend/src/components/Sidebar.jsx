import { NavLink } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { brand } from '@/styles/theme'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { pages, labelOf } from '@/routes'
import { ROLES, UNIVERSITY } from '@/utils/labels'

export default function Sidebar({ open, onNavigate }) {
  const { t } = useTheme()
  const { role } = useAuth()
  // เมนู + สิทธิ์ที่มองเห็นแต่ละ role กำหนดไว้ใน routes.jsx
  const items = pages.filter(m => m.roles.includes(role) && m.menu !== false)

  return (
    <aside className={`rail no-print ${open ? 'open' : ''}`}
      style={{ width: 264, flexShrink: 0, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
        color: t.railText, background: `linear-gradient(180deg, ${brand.deep}, ${brand.oxblood})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 18px' }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fff', color: brand.oxblood, display: 'grid', placeItems: 'center' }}>
          <GraduationCap size={24} />
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>CWIE · RMUTR</div>
          <div style={{ fontSize: 11.5, color: t.railMuted }}>{UNIVERSITY.faculty} {UNIVERSITY.campus}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: t.railMuted, padding: '0 8px 6px' }}>ระบบสหกิจศึกษา CWIE · {ROLES[role]}</div>

      {items.map(m => (
        <NavLink key={m.path} to={m.path} end={m.path === '/'} onClick={onNavigate}
          className="navbtn press"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, flexShrink: 0,
            textDecoration: 'none', color: t.railText, fontSize: 14.5, fontWeight: isActive ? 600 : 500,
            background: isActive ? 'rgba(255,255,255,.16)' : 'transparent',
            boxShadow: isActive ? `inset 3px 0 0 ${brand.gold}` : 'none',
          })}>
          <m.icon size={19} /> {labelOf(m, role)}
        </NavLink>
      ))}

      <div style={{ marginTop: 'auto', fontSize: 11, color: t.railMuted, padding: 8, borderTop: '1px solid rgba(255,255,255,.15)' }}>
        {UNIVERSITY.faculty}<br />{UNIVERSITY.short} {UNIVERSITY.campus}
      </div>
    </aside>
  )
}
