import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Link2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import ProgressBar from '@/components/common/ProgressBar'
import { StatusChip } from '@/components/common/Chip'
import FilterBar, { useUrlFilters, matches } from '@/components/common/FilterBar'
import FormModal from '@/components/form/FormModal'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { PLACEMENT_STATUS, isStaff } from '@/utils/labels'
import { formatDate, progressOf } from '@/utils/format'

const TITLES = {
  advisor:   ['นักศึกษาที่รับผิดชอบ', 'นักศึกษาที่ได้รับมอบหมายให้นิเทศ ติดตาม และประเมิน'],
  counselor: ['นักศึกษาในความดูแล', 'ติดตามความคืบหน้า รับรองใบสมัคร และให้คำปรึกษา'],
  employer:  ['นักศึกษาที่เข้าปฏิบัติงาน', 'ยืนยันการรับนักศึกษา บันทึกการปฏิบัติงาน และประเมินผล'],
  office:    ['การจับคู่และออกฝึก', 'อนุมัติใบสมัคร จับคู่นักศึกษากับสถานประกอบการ และมอบหมายอาจารย์นิเทศ'],
}

// ตาราง/ป้ายข้อมูลนักศึกษา ใช้ซ้ำในแดชบอร์ด
export function StudentCell({ p }) {
  const { t } = useTheme()
  return (
    <div>
      <div style={{ fontWeight: 600 }}>{p.student?.fullName}</div>
      <div style={{ fontSize: 12.5, color: t.muted }}>{p.student?.studentId} · {p.student?.program || '-'}</div>
    </div>
  )
}

export function PeriodCell({ p }) {
  const { t } = useTheme()
  if (p.status === 'active') {
    const { week, weeks, pct } = progressOf(p.startDate, p.endDate)
    return <ProgressBar pct={pct} label={`สัปดาห์ ${week}/${weeks}`} />
  }
  return <span style={{ fontSize: 13, color: t.muted }}>{formatDate(p.startDate)} – {formatDate(p.endDate)}</span>
}

export const optionsOf = (rows, label = (r) => r.fullName) => (rows || []).map((r) => ({ value: r.id, label: label(r) }))

export default function PlacementList() {
  const { t } = useTheme()
  const { role } = useAuth()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const filter = useUrlFilters(params, setParams)
  const [q, setQ] = useState('')
  const [matching, setMatching] = useState(false)
  const staff = isStaff(role)
  const { data, loading, error, reload } = useApi('/placements')
  const students = useApi(staff ? '/users?role=student' : null)
  const advisors = useApi(staff ? '/users?role=advisor' : null)
  const companies = useApi(staff ? '/companies' : null)

  const [title, subtitle] = TITLES[staff ? 'office' : role]
  const rows = data?.filter((p) => (!filter.get('status') || p.status === filter.get('status')) &&
    matches(q, p.student?.fullName, p.student?.studentId, p.company?.name, p.position, p.advisor?.fullName))

  // นักศึกษาที่ยังไม่มีรายการออกฝึกที่ค้างอยู่ (จับคู่ได้)
  const busy = new Set(data?.filter((p) => !['completed', 'rejected'].includes(p.status)).map((p) => p.studentId))
  const freeStudents = students.data?.filter((s) => !busy.has(s.id))

  return (
    <div style={{ maxWidth: 1180 }}>
      <PageHeader title={title} subtitle={subtitle}
        actions={staff && <Button icon={Link2} onClick={() => setMatching(true)}>จับคู่นักศึกษา</Button>} />

      <FilterBar search={q} onSearch={setQ} onFilter={filter.set} filters={[{
        key: 'status', label: 'สถานะ', value: filter.get('status'),
        options: Object.entries(PLACEMENT_STATUS).map(([value, s]) => ({ value, label: s.label })),
      }]} />

      <Table loading={loading} error={error} rows={rows} onRowClick={(p) => nav(`/placements/${p.id}`)}
        empty={data?.length ? 'ไม่พบรายการตามเงื่อนไข' : 'ยังไม่มีนักศึกษา'}
        columns={[
          { key: 'student', label: 'นักศึกษา', render: (p) => <StudentCell p={p} /> },
          { key: 'company', label: 'สถานประกอบการ / ตำแหน่ง', render: (p) => (
            <div><div>{p.company?.name}</div><div style={{ fontSize: 12.5, color: t.muted }}>{p.position}</div></div>) },
          { key: 'advisor', label: 'อาจารย์นิเทศ', render: (p) => p.advisor?.fullName || <span style={{ color: t.muted }}>ยังไม่มอบหมาย</span> },
          { key: 'period', label: 'ช่วงเวลา / ความคืบหน้า', render: (p) => <PeriodCell p={p} /> },
          { key: 'status', label: 'สถานะ', nowrap: true, render: (p) => <StatusChip map={PLACEMENT_STATUS} value={p.status} /> },
        ]} />

      {matching && (
        <FormModal title="จับคู่นักศึกษากับสถานประกอบการ" subtitle='กองสหกิจจับคู่ให้โดยตรง สถานะจะเป็น "รอสถานประกอบการยืนยัน"'
          submitLabel="จับคู่" onClose={() => setMatching(false)}
          fields={[
            { key: 'studentId', label: 'นักศึกษา', type: 'select', required: true, options: optionsOf(freeStudents, (s) => `${s.fullName} (${s.studentId})`) },
            { key: 'companyId', label: 'สถานประกอบการ', type: 'select', required: true, options: optionsOf(companies.data, (c) => c.name + (c.verified ? '' : ' (ยังไม่ตรวจสอบ)')) },
            { key: 'advisorId', label: 'อาจารย์นิเทศ', type: 'select', options: optionsOf(advisors.data) },
            { key: 'position', label: 'ตำแหน่งงาน', required: true },
            { key: 'startDate', label: 'วันเริ่มปฏิบัติงาน', type: 'date', required: true },
            { key: 'endDate', label: 'วันสิ้นสุด', type: 'date', required: true },
          ]}
          onSubmit={(v) => api.post('/placements', v).then(reload)} />
      )}
    </div>
  )
}
