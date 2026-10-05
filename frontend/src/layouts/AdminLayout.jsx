import { useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { pages, labelOf } from '@/routes'

export default function AdminLayout({ children }) {
  const { t } = useTheme()
  const { role } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const page = pages.find(p => matchPath(p.path, pathname))

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.ink, display: 'flex',
      fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif" }}>
      {open && <div className="overlay no-print" onClick={() => setOpen(false)} />}
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Navbar title={page ? labelOf(page, role) : 'ระบบสหกิจศึกษา CWIE'} onMenu={() => setOpen(v => !v)} />
        <main style={{ padding: '22px clamp(16px, 3vw, 30px)', overflow: 'auto' }}>{children}</main>
      </div>
    </div>
  )
}
