import { useRef, useState } from 'react'
import { ExternalLink, Maximize2, Minimize2, RotateCw, FlaskConical } from 'lucide-react'
import Button from '@/components/common/Button'
import Chip from '@/components/common/Chip'
import { useTheme } from '@/context/ThemeContext'
import { brand } from '@/styles/theme'
import { ROLES } from '@/utils/labels'
import { PRETEST_ACCOUNTS, PRETEST_PASSWORD } from '@/utils/pretest'

const ZOOMS = [0.5, 0.6, 0.75, 1]

// โหมดทดสอบ (เฉพาะตอน dev): เปิดทุกบทบาทพร้อมกันในหน้าเดียว แต่ละกรอบ login คนละบัญชี
// ทำอะไรในกรอบหนึ่ง แล้วกด "รีเฟรชทั้งหมด" เพื่อดูผลในมุมมองของบทบาทอื่น
export default function Pretest() {
  const { t } = useTheme()
  const [cols, setCols] = useState(3)
  const [zoom, setZoom] = useState(0.6)
  const [height, setHeight] = useState(520)
  const [focus, setFocus] = useState(null)
  const [round, setRound] = useState(0) // เปลี่ยนค่า = โหลดทุกกรอบใหม่
  const frames = useRef({})

  const shown = focus ? PRETEST_ACCOUNTS.filter((a) => a.role === focus) : PRETEST_ACCOUNTS
  const reload = (role) => frames.current[role]?.contentWindow?.location.reload()
  const select = { background: t.surface, color: t.ink, border: `1px solid ${t.line}`, borderRadius: 9, padding: '7px 9px', fontSize: 13.5 }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.ink, fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif" }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 5, background: t.surface, borderBottom: `1px solid ${t.line}`,
        padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <FlaskConical size={22} color={brand.bright} />
        <div style={{ marginRight: 'auto' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>โหมดทดสอบ — เปิดทุกบทบาทพร้อมกัน</div>
          <div style={{ fontSize: 12.5, color: t.muted }}>
            แต่ละกรอบ login อัตโนมัติด้วยบัญชีทดลอง (รหัสผ่าน {PRETEST_PASSWORD}) · ทำรายการในกรอบหนึ่งแล้วกด "รีเฟรชทั้งหมด" เพื่อดูผลในบทบาทอื่น
          </div>
        </div>
        <label style={{ fontSize: 13, color: t.muted }}>คอลัมน์{' '}
          <select value={cols} onChange={(e) => setCols(+e.target.value)} style={select} disabled={!!focus}>
            {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 13, color: t.muted }}>ซูม{' '}
          <select value={zoom} onChange={(e) => setZoom(+e.target.value)} style={select}>
            {ZOOMS.map((z) => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
          </select>
        </label>
        <label style={{ fontSize: 13, color: t.muted }}>ความสูง{' '}
          <select value={height} onChange={(e) => setHeight(+e.target.value)} style={select}>
            {[400, 520, 680, 860].map((h) => <option key={h} value={h}>{h}px</option>)}
          </select>
        </label>
        <Button small icon={RotateCw} onClick={() => setRound((r) => r + 1)}>รีเฟรชทั้งหมด</Button>
        <Button small variant="secondary" onClick={() => { location.href = '/' }}>ออกจากโหมดทดสอบ</Button>
      </header>

      <main style={{ padding: 16, display: 'grid', gap: 14, gridTemplateColumns: `repeat(${focus ? 1 : cols}, minmax(0, 1fr))` }}>
        {shown.map((a) => (
          <section key={a.role} style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden', boxShadow: t.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: `1px solid ${t.line}`, flexWrap: 'wrap' }}>
              <Chip tone="bad">{ROLES[a.role]}</Chip>
              <span style={{ fontSize: 12.5, color: t.muted, marginRight: 'auto' }}>{a.email}</span>
              <IconBtn label="รีเฟรช" onClick={() => reload(a.role)}><RotateCw size={15} /></IconBtn>
              <IconBtn label={focus ? 'ย่อกลับ' : 'ขยาย'} onClick={() => setFocus(focus ? null : a.role)}>
                {focus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </IconBtn>
              <IconBtn label="เปิดในแท็บใหม่" onClick={() => window.open(`/?pretest=${a.role}`, '_blank')}><ExternalLink size={15} /></IconBtn>
            </div>
            {/* iframe ใหญ่จริงแล้วย่อด้วย scale ให้เห็นทั้งหน้าในกรอบเล็ก */}
            <div style={{ height: focus ? 'calc(100vh - 150px)' : height, overflow: 'hidden', position: 'relative' }}>
              <iframe key={`${a.role}-${round}`} ref={(el) => { frames.current[a.role] = el }}
                src={`/?pretest=${a.role}`} title={ROLES[a.role]}
                style={{ border: 'none', width: `${100 / zoom}%`, height: `${100 / zoom}%`, transform: `scale(${zoom})`, transformOrigin: '0 0' }} />
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

function IconBtn({ label, onClick, children }) {
  const { t } = useTheme()
  return (
    <button onClick={onClick} title={label} aria-label={label}
      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.line}`, background: t.surface2, color: t.ink, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
      {children}
    </button>
  )
}
