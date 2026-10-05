import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Check, CalendarRange, GraduationCap, Plus, UserCheck } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Button from '@/components/common/Button'
import Tabs from '@/components/common/Tabs'
import Timeline from '@/components/common/Timeline'
import ProgressBar from '@/components/common/ProgressBar'
import { StatusChip } from '@/components/common/Chip'
import { Status } from '@/components/common/PageHeader'
import FormModal from '@/components/form/FormModal'
import DocumentList from '@/components/DocumentList'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { brand } from '@/styles/theme'
import { PLACEMENT_STATUS, PLACEMENT_STEPS, ROLES, SUPERVISION_CHANNELS, isStaff } from '@/utils/labels'
import { formatDate, formatDateTime, progressOf, today, initialOf } from '@/utils/format'
import { optionsOf } from './PlacementList'

const STARTED = ['active', 'completed']

// หน้ารายละเอียดการออกฝึก 1 รายการ — ศูนย์กลางของทุกขั้นตอน (ใช้ทั้งหน้า /placements/:id และหน้าของนักศึกษา)
export default function PlacementDetail({ id: idProp }) {
  const params = useParams()
  const id = idProp || params.id
  const { t } = useTheme()
  const { role } = useAuth()
  const { data, loading, error, reload } = useApi(`/placements/${id}`)
  const [tab, setTab] = useState('history')
  const [modal, setModal] = useState(null)
  const staff = isStaff(role)
  const people = useApi(staff ? '/users' : null)
  const companies = useApi(staff ? '/companies' : null)

  if (!data) return <Status loading={loading} error={error} />
  const p = data.placement
  const started = STARTED.includes(p.status)
  const act = (action) => (v) => api.put(`/placements/${p.id}/action`, { action, ...v }).then(reload)
  const byRole = (r) => optionsOf(people.data?.filter((u) => u.role === r))

  // ปุ่มดำเนินการตามบทบาทและสถานะ
  const actions = []
  const add = (label, form, variant) => actions.push({ label, form, variant })
  const rejectForm = { title: 'ตีกลับ / ไม่อนุมัติ', submitLabel: 'ตีกลับ', danger: true, fields: [{ key: 'note', label: 'เหตุผล', type: 'textarea', required: true }], onSubmit: act('reject') }
  const noteField = [{ key: 'note', label: 'หมายเหตุ (ถ้ามี)', type: 'textarea' }]

  if (p.status === 'pending_counselor' && (role === 'counselor' || staff)) {
    add('รับรองใบสมัคร', { title: 'รับรองใบสมัครของนักศึกษา', submitLabel: 'รับรอง', fields: noteField, onSubmit: act('endorse') })
  }
  if (['pending_counselor', 'pending_office'].includes(p.status) && staff) {
    add('อนุมัติ', { title: 'อนุมัติและมอบหมายอาจารย์นิเทศ', submitLabel: 'อนุมัติ', initial: { advisorId: p.advisorId || '' },
      fields: [{ key: 'advisorId', label: 'อาจารย์นิเทศ', type: 'select', required: true, options: byRole('advisor') }, ...noteField], onSubmit: act('approve') })
  }
  if (p.status === 'pending_company' && (role === 'employer' || staff)) {
    add('ยืนยันรับนักศึกษา', { title: 'ยืนยันรับนักศึกษาเข้าปฏิบัติงาน', submitLabel: 'ยืนยันรับ', fields: noteField, onSubmit: act('confirm') })
  }
  if (['pending_counselor', 'pending_office', 'pending_company'].includes(p.status) && (staff || role === 'counselor' || role === 'employer')) {
    add('ตีกลับ', rejectForm, 'danger')
  }
  if (p.status === 'active' && (role === 'advisor' || staff)) {
    add('ปฏิบัติงานเสร็จสิ้น', { title: 'บันทึกว่าปฏิบัติงานเสร็จสิ้น', submitLabel: 'ยืนยัน', fields: noteField, onSubmit: act('complete') }, 'secondary')
  }
  if (staff) {
    add('แก้ไข / มอบหมาย', {
      title: 'แก้ไขข้อมูลการออกฝึก', initial: p,
      fields: [
        { key: 'companyId', label: 'สถานประกอบการ', type: 'select', required: true, options: optionsOf(companies.data, (c) => c.name) },
        { key: 'position', label: 'ตำแหน่งงาน', required: true },
        { key: 'startDate', label: 'วันเริ่ม', type: 'date', required: true },
        { key: 'endDate', label: 'วันสิ้นสุด', type: 'date', required: true },
        { key: 'advisorId', label: 'อาจารย์นิเทศ', type: 'select', options: byRole('advisor') },
        { key: 'counselorId', label: 'อาจารย์ที่ปรึกษา', type: 'select', options: byRole('counselor') },
      ],
      onSubmit: (v) => api.put(`/placements/${p.id}`, { ...v, advisorId: v.advisorId || null, counselorId: v.counselorId || null }).then(reload),
    }, 'secondary')
  }

  const canActivity = ['employer', 'advisor', 'office', 'admin'].includes(role) && started
  const canSupervise = ['advisor', 'admin'].includes(role) && started && data.supervisions.length < 2
  const canAdvise = ['counselor', 'admin'].includes(role)
  const myEvalRole = ['employer', 'advisor'].includes(role) && started && !data.evaluations.some((e) => e.evaluatorRole === role) ? role : null

  const tabs = [
    { key: 'history', label: 'ขั้นตอนการดำเนินงาน' },
    { key: 'documents', label: 'เอกสาร', count: data.documents.length },
    { key: 'activities', label: 'บันทึกกิจกรรม', count: data.activities.length },
    { key: 'supervisions', label: 'การนิเทศ', count: data.supervisions.length },
    { key: 'evaluations', label: 'ผลการประเมิน', count: data.evaluations.length },
    { key: 'advices', label: 'ข้อเสนอแนะ', count: data.advices.length },
  ]

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1080 }}>
      {!idProp && (
        <Link to="/placements" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: t.muted, fontSize: 14, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> กลับไปรายการ
        </Link>
      )}

      {/* หัวข้อ: นักศึกษา + สถานะ + ปุ่มดำเนินการ */}
      <Panel style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: brand.oxblood, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 20 }}>
          {initialOf(p.student?.fullName)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{p.student?.fullName}</div>
          <div style={{ fontSize: 13.5, color: t.muted }}>รหัส {p.student?.studentId} · {p.student?.program || '-'} · {p.student?.email}</div>
        </div>
        <StatusChip map={PLACEMENT_STATUS} value={p.status} />
        {actions.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
            {actions.map((a) => <Button key={a.label} small variant={a.variant} onClick={() => setModal(a.form)}>{a.label}</Button>)}
          </div>
        )}
      </Panel>

      <Steps status={p.status} />

      {/* ข้อมูลสถานประกอบการ / ช่วงเวลา / อาจารย์ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
        <InfoCard icon={Building2} title="สถานประกอบการ" lines={[p.company?.name, p.position, p.company?.address, p.company?.contactName && `ติดต่อ: ${p.company.contactName} ${p.company.phone || ''}`]} />
        <InfoCard icon={CalendarRange} title="ช่วงปฏิบัติงาน" lines={[`${formatDate(p.startDate)} – ${formatDate(p.endDate)}`]}>
          {p.status === 'active' && (() => { const pr = progressOf(p.startDate, p.endDate); return <ProgressBar pct={pr.pct} label={`สัปดาห์ ${pr.week}/${pr.weeks}`} width="100%" /> })()}
        </InfoCard>
        <InfoCard icon={UserCheck} title="อาจารย์นิเทศ" lines={p.advisor ? [p.advisor.fullName, p.advisor.email, p.advisor.phone] : ['ยังไม่ได้มอบหมาย']} />
        <InfoCard icon={GraduationCap} title="อาจารย์ที่ปรึกษา" lines={p.counselor ? [p.counselor.fullName, p.counselor.email, p.counselor.phone] : ['ยังไม่ได้กำหนด']} />
      </div>

      <Panel style={{ padding: '6px 20px 20px' }}>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === 'history' && <Timeline items={p.history} />}

        {tab === 'documents' && (
          <DocumentList showStudent={false} reload={reload}
            docs={data.documents.map((d) => ({ ...d, studentName: p.student?.fullName, studentCode: p.student?.studentId }))} />
        )}

        {tab === 'activities' && (
          <NoteList items={data.activities} empty={started ? 'ยังไม่มีบันทึกกิจกรรม' : 'นักศึกษายังไม่ได้เริ่มปฏิบัติงาน'}
            addLabel={canActivity && 'บันทึกกิจกรรม'}
            onAdd={() => setModal(noteForm('บันทึกกิจกรรม / การปฏิบัติงาน', '/activities', p.id, reload))} />
        )}

        {tab === 'supervisions' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {canSupervise && <div><Button small icon={Plus} onClick={() => setModal(supervisionForm(p.id, data.supervisions.length + 1, reload))}>บันทึกการนิเทศครั้งที่ {data.supervisions.length + 1}</Button></div>}
            {data.supervisions.length === 0 && <Empty>ยังไม่มีการนิเทศ (นิเทศได้สูงสุด 2 ครั้ง)</Empty>}
            {data.supervisions.map((s) => (
              <Item key={s.id} title={`นิเทศครั้งที่ ${s.round} · ${s.channel}`} meta={`${formatDate(s.date)} · ${s.authorName}`}>
                <div>{s.result}</div>
                {s.suggestion && <div style={{ color: t.muted, marginTop: 4 }}>ข้อเสนอแนะ: {s.suggestion}</div>}
              </Item>
            ))}
          </div>
        )}

        {tab === 'evaluations' && (
          <Evaluations items={data.evaluations} evalRole={myEvalRole} placementId={p.id} reload={reload} setModal={setModal} started={started} />
        )}

        {tab === 'advices' && (
          <NoteList items={data.advices} empty="ยังไม่มีข้อเสนอแนะจากอาจารย์ที่ปรึกษา"
            addLabel={canAdvise && 'บันทึกข้อเสนอแนะ'}
            onAdd={() => setModal(noteForm('บันทึกความคิดเห็น / ข้อเสนอแนะ', '/advices', p.id, reload))} />
        )}
      </Panel>

      {modal && <FormModal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}

// ----- ฟอร์ม -----
const noteForm = (title, path, placementId, reload) => ({
  title, initial: { date: today() },
  fields: [
    { key: 'date', label: 'วันที่', type: 'date', required: true },
    { key: 'title', label: 'หัวข้อ' },
    { key: 'detail', label: 'รายละเอียด', type: 'textarea', rows: 4, required: true },
  ],
  onSubmit: (v) => api.post(path, { ...v, placementId }).then(reload),
})

const supervisionForm = (placementId, round, reload) => ({
  title: `บันทึกผลการนิเทศ ครั้งที่ ${round}`, initial: { date: today(), channel: SUPERVISION_CHANNELS[0] },
  fields: [
    { key: 'date', label: 'วันที่นิเทศ', type: 'date', required: true },
    { key: 'channel', label: 'ช่องทาง', type: 'select', placeholder: false, options: SUPERVISION_CHANNELS.map((c) => ({ value: c, label: c })) },
    { key: 'result', label: 'ผลการนิเทศ / สภาพการปฏิบัติงาน', type: 'textarea', rows: 4, required: true },
    { key: 'suggestion', label: 'ข้อเสนอแนะ', type: 'textarea' },
  ],
  onSubmit: (v) => api.post('/supervisions', { ...v, placementId }).then(reload),
})

// ----- ส่วนประกอบย่อย -----
function Steps({ status }) {
  const { t } = useTheme()
  const order = PLACEMENT_STEPS.map((s) => s.key)
  const current = status === 'completed' ? order.length : order.indexOf(status)
  return (
    <Panel style={{ padding: '16px 20px', overflowX: 'auto' }}>
      {status === 'rejected'
        ? <div style={{ color: brand.bright, fontWeight: 600 }}>ใบสมัครนี้ถูกตีกลับ / ไม่อนุมัติ — ดูเหตุผลในขั้นตอนการดำเนินงาน</div>
        : (
          <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 560 }}>
            {PLACEMENT_STEPS.map((s, i) => {
              const done = i < current, now = i === current
              return (
                <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {i > 0 && <span style={{ position: 'absolute', top: 13, right: '50%', width: '100%', height: 2, background: i <= current ? brand.oxblood : t.line }} />}
                  <span style={{ position: 'relative', width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
                    background: done ? brand.oxblood : now ? t.surface : t.surface2, color: done ? '#fff' : now ? brand.bright : t.muted,
                    border: `2px solid ${done || now ? brand.oxblood : t.line}` }}>{done ? <Check size={15} strokeWidth={3} /> : i + 1}</span>
                  <span style={{ fontSize: 12.5, marginTop: 6, textAlign: 'center', color: now ? t.ink : t.muted, fontWeight: now ? 600 : 400 }}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
    </Panel>
  )
}

function InfoCard({ icon: Icon, title, lines, children }) {
  const { t } = useTheme()
  return (
    <Panel style={{ padding: 16, display: 'grid', gap: 6, alignContent: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.muted, fontSize: 13 }}><Icon size={16} /> {title}</div>
      {lines.filter(Boolean).map((l, i) => <div key={i} style={{ fontSize: i === 0 ? 15 : 13.5, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? t.ink : t.muted }}>{l}</div>)}
      {children}
    </Panel>
  )
}

function Item({ title, meta, children }) {
  const { t } = useTheme()
  return (
    <div style={{ border: `1px solid ${t.line}`, borderRadius: 12, padding: 14, fontSize: 14 }}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: t.muted, marginBottom: 6 }}>{meta}</div>
      {children}
    </div>
  )
}

function Empty({ children }) {
  const { t } = useTheme()
  return <div style={{ color: t.muted, fontSize: 14, padding: '12px 0' }}>{children}</div>
}

function NoteList({ items, empty, addLabel, onAdd }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {addLabel && <div><Button small icon={Plus} onClick={onAdd}>{addLabel}</Button></div>}
      {items.length === 0 && <Empty>{empty}</Empty>}
      {items.map((n) => (
        <Item key={n.id} title={n.title || 'บันทึก'} meta={`${formatDate(n.date)} · ${n.authorName} (${ROLES[n.authorRole] || ''})`}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{n.detail}</div>
        </Item>
      ))}
    </div>
  )
}

function Evaluations({ items, evalRole, placementId, reload, setModal, started }) {
  const { t } = useTheme()
  const rubrics = useApi(evalRole ? '/evaluations/rubrics' : null)

  const openForm = () => {
    const rubric = rubrics.data[evalRole]
    setModal({
      title: `แบบประเมินนักศึกษา (${ROLES[evalRole]})`, subtitle: 'ให้คะแนนแต่ละหัวข้อ 0–100 ระบบคิดคะแนนถ่วงน้ำหนักให้', submitLabel: 'ส่งผลการประเมิน',
      fields: [
        ...rubric.map((r) => ({ key: r.key, label: `${r.label} (น้ำหนัก ${r.weight}%)`, type: 'number', min: 0, max: 100, required: true })),
        { key: 'comment', label: 'ความคิดเห็นเพิ่มเติม', type: 'textarea' },
      ],
      onSubmit: ({ comment, ...scores }) => api.post('/evaluations', { placementId, scores, comment }).then(reload),
    })
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {evalRole && rubrics.data && <div><Button small icon={Plus} onClick={openForm}>ประเมินนักศึกษา</Button></div>}
      {items.length === 0 && <Empty>{started ? 'ยังไม่มีผลการประเมิน' : 'นักศึกษายังไม่ได้เริ่มปฏิบัติงาน'}</Empty>}
      {items.map((e) => (
        <Item key={e.id} title={`ประเมินโดย${ROLES[e.evaluatorRole]} — ${e.total}/100 (${e.grade})`} meta={`${e.authorName} · ${formatDateTime(e.createdAt)}`}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <tbody>
              {e.scores.map((s) => (
                <tr key={s.key}>
                  <td style={{ padding: '5px 0', borderBottom: `1px solid ${t.line}` }}>{s.label} <span style={{ color: t.muted }}>({s.weight}%)</span></td>
                  <td style={{ padding: '5px 0', borderBottom: `1px solid ${t.line}`, textAlign: 'right', fontWeight: 600 }}>{s.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {e.comment && <div style={{ color: t.muted, marginTop: 8 }}>ความคิดเห็น: {e.comment}</div>}
        </Item>
      ))}
    </div>
  )
}
