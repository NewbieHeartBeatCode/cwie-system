import { useNavigate, Link } from 'react-router-dom'
import { Users, Clock, FileCheck2, Building2, ChevronRight, ClipboardCheck, Hourglass, FileWarning, CalendarDays, Megaphone } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Chip, { StatusChip } from '@/components/common/Chip'
import { Status } from '@/components/common/PageHeader'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { brand } from '@/styles/theme'
import { KINDS, PLACEMENT_STATUS, ROLES, isStaff } from '@/utils/labels'
import { formatDate, initialOf } from '@/utils/format'
import { PeriodCell } from './placements/PlacementList'

const sum = (obj = {}, keys) => keys.reduce((s, k) => s + (obj[k] || 0), 0)
const PENDING = ['pending_counselor', 'pending_office', 'pending_company']

export default function Dashboard() {
  const { t } = useTheme()
  const { user, role } = useAuth()
  const nav = useNavigate()
  const { data, loading, error } = useApi('/dashboard')

  if (!data) return <Status loading={loading} error={error} />
  const ps = data.placements.byStatus
  const ds = data.documents.byStatus
  const student = role === 'student'

  const stats = student
    ? [
      { n: data.recent[0] ? PLACEMENT_STATUS[data.recent[0].status].label : 'ยังไม่ได้สมัคร', l: 'สถานะการเข้าร่วม CWIE', icon: Hourglass, c: brand.oxblood, small: true },
      { n: data.documents.total, l: 'เอกสารที่ส่งแล้ว', icon: FileCheck2, c: brand.bright },
      { n: ds.approved || 0, l: 'เอกสารอนุมัติแล้ว', icon: ClipboardCheck, c: '#1f9d4d' },
      { n: ds.returned || 0, l: 'เอกสารถูกตีกลับ', icon: FileWarning, c: brand.gold },
    ]
    : [
      { n: data.students, l: isStaff(role) ? 'นักศึกษาทั้งหมด' : 'นักศึกษาที่เกี่ยวข้อง', icon: Users, c: brand.oxblood },
      { n: ps.active || 0, l: 'กำลังปฏิบัติงาน', icon: Clock, c: brand.bright },
      { n: sum(ps, PENDING), l: 'รอดำเนินการ (ใบสมัคร)', icon: Hourglass, c: brand.gold },
      isStaff(role)
        ? { n: data.companies.total, l: `สถานประกอบการ (รอตรวจสอบ ${data.companies.unverified})`, icon: Building2, c: '#2f6db5' }
        : { n: sum(ds, ['submitted', 'certified']), l: 'เอกสารรอตรวจสอบ/อนุมัติ', icon: FileCheck2, c: '#2f6db5' },
    ]

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 1120 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>สวัสดี {user.fullName}</h1>
        <p style={{ margin: '6px 0 0', color: t.muted, fontSize: 14.5 }}>ภาพรวมระบบสหกิจศึกษา CWIE · มุมมอง{ROLES[role]}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {stats.map((s) => (
          <Panel key={s.l} style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 12, background: s.c + '1a', color: s.c, display: 'grid', placeItems: 'center' }}>
              <s.icon size={23} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: s.small ? 16 : 27, fontWeight: 700, lineHeight: 1.15 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: t.muted, marginTop: 3 }}>{s.l}</div>
            </div>
          </Panel>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          <PanelHead title="งานที่ต้องดำเนินการ" />
          {data.todos.length === 0 && <div style={{ padding: '18px 20px', color: t.muted, fontSize: 14 }}>ไม่มีงานค้าง</div>}
          {data.todos.map((td, i) => (
            <Link key={td.label} to={td.to} className="row"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', textDecoration: 'none', color: t.ink, borderTop: i ? `1px solid ${t.line}` : 'none' }}>
              <span style={{ minWidth: 30, height: 30, padding: '0 8px', borderRadius: 99, background: brand.oxblood, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>{td.count}</span>
              <span style={{ fontSize: 14.5 }}>{td.label}</span>
              <ChevronRight size={17} color={t.muted} style={{ marginLeft: 'auto' }} />
            </Link>
          ))}
        </Panel>

        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          <PanelHead title="ประกาศและกำหนดการ" link="/announcements" />
          {data.announcements.length === 0 && <div style={{ padding: '18px 20px', color: t.muted, fontSize: 14 }}>ยังไม่มีประกาศ</div>}
          {data.announcements.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 12, padding: '13px 20px', borderTop: i ? `1px solid ${t.line}` : 'none' }}>
              {a.kind === 'schedule' ? <CalendarDays size={19} color={brand.bright} /> : <Megaphone size={19} color={brand.bright} />}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12.5, color: t.muted }}>{KINDS[a.kind]} · {formatDate(a.date)}{a.companyName ? ` · ${a.companyName}` : ''}</div>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {!student && (
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          <PanelHead title="ความเคลื่อนไหวล่าสุด" link="/placements" />
          {data.recent.length === 0 && <div style={{ padding: '18px 20px', color: t.muted, fontSize: 14 }}>ยังไม่มีข้อมูลนักศึกษา</div>}
          {data.recent.map((p, i) => (
            <div key={p.id} className="row" onClick={() => nav(`/placements/${p.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderTop: i ? `1px solid ${t.line}` : 'none', flexWrap: 'wrap', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: brand.oxblood + '18', color: brand.bright, display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {initialOf(p.student?.fullName)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{p.student?.fullName}</div>
                <div style={{ fontSize: 12.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 5 }}><Building2 size={13} /> {p.company?.name}</div>
              </div>
              <PeriodCell p={p} />
              <StatusChip map={PLACEMENT_STATUS} value={p.status} />
            </div>
          ))}
        </Panel>
      )}

      {data.users && (
        <Panel style={{ padding: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, marginRight: 6 }}>ผู้ใช้ในระบบ</span>
          {Object.entries(ROLES).map(([k, label]) => <Chip key={k}>{label}: {data.users[k] || 0}</Chip>)}
        </Panel>
      )}
    </div>
  )
}

function PanelHead({ title, link }) {
  const { t } = useTheme()
  return (
    <div style={{ padding: '15px 20px', borderBottom: `1px solid ${t.line}`, display: 'flex', alignItems: 'center' }}>
      <div style={{ fontWeight: 600, fontSize: 15.5 }}>{title}</div>
      {link && (
        <Link to={link} style={{ marginLeft: 'auto', color: brand.bright, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600, textDecoration: 'none' }}>
          ดูทั้งหมด <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}
