import { Printer } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import { StatusChip } from '@/components/common/Chip'
import PageHeader, { Status } from '@/components/common/PageHeader'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { brand } from '@/styles/theme'
import { PLACEMENT_STATUS, UNIVERSITY, isStaff } from '@/utils/labels'
import { formatDate } from '@/utils/format'

// รายงานและสถิติ (พิมพ์เป็น PDF ได้) — ขอบเขตตามสิทธิ์ของผู้ใช้
export default function Reports() {
  const { t } = useTheme()
  const { role } = useAuth()
  const { data, loading, error } = useApi('/reports')

  if (!data) return <Status loading={loading} error={error} />
  const s = data.summary
  const max = Math.max(1, ...s.byCompany.map((c) => c.count))
  const score = (v) => (v === null ? <span style={{ color: t.muted }}>-</span> : v)

  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: 1180 }}>
      <div style={{ fontSize: 13, color: t.muted, marginBottom: -12 }}>{UNIVERSITY.name} · {UNIVERSITY.faculty} · {UNIVERSITY.campus}</div>
      <PageHeader title="รายงานและสถิติ"
        subtitle={isStaff(role) ? `ภาพรวม CWIE ทั้งหมด · ข้อมูล ณ ${formatDate(new Date().toISOString())}` : 'เฉพาะนักศึกษาที่คุณรับผิดชอบ'}
        actions={<Button variant="secondary" icon={Printer} onClick={() => window.print()} className="no-print">พิมพ์ / บันทึก PDF</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {[
          ['นักศึกษาทั้งหมด', s.total],
          ['กำลังปฏิบัติงาน', s.byStatus.active || 0],
          ['เสร็จสิ้น', s.byStatus.completed || 0],
          ['นิเทศครบ 2 ครั้ง', s.supervisionDone],
          [`คะแนนเฉลี่ย (สถานประกอบการ) จาก ${s.employerScoreCount} คน`, s.avgEmployerScore ?? '-'],
          [`คะแนนเฉลี่ย (อาจารย์นิเทศ) จาก ${s.advisorScoreCount} คน`, s.avgAdvisorScore ?? '-'],
        ].map(([label, n]) => (
          <Panel key={label} style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{n}</div>
            <div style={{ fontSize: 13, color: t.muted }}>{label}</div>
          </Panel>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <Panel style={{ padding: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>จำนวนนักศึกษาตามสถานะ</div>
          {Object.entries(PLACEMENT_STATUS).filter(([k]) => k !== 'rejected').map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.line}`, fontSize: 14 }}>
              <span>{v.label}</span><b>{s.byStatus[k] || 0}</b>
            </div>
          ))}
        </Panel>
        <Panel style={{ padding: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>จำนวนนักศึกษาตามสถานประกอบการ</div>
          {s.byCompany.length === 0 && <div style={{ color: t.muted, fontSize: 14 }}>ยังไม่มีข้อมูล</div>}
          {s.byCompany.map((c) => (
            <div key={c.name} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 4 }}><span>{c.name}</span><b>{c.count}</b></div>
              <div style={{ height: 8, background: t.line, borderRadius: 99 }}>
                <div style={{ width: (c.count / max) * 100 + '%', height: '100%', borderRadius: 99, background: brand.oxblood }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>

      <Table rows={data.rows} empty="ยังไม่มีข้อมูลนักศึกษา" columns={[
        { key: 'student', label: 'นักศึกษา', render: (r) => <div><div style={{ fontWeight: 600 }}>{r.studentName}</div><div style={{ fontSize: 12.5, color: t.muted }}>{r.studentCode}</div></div> },
        { key: 'companyName', label: 'สถานประกอบการ' },
        { key: 'advisorName', label: 'อาจารย์นิเทศ', render: (r) => r.advisorName || '-' },
        { key: 'status', label: 'สถานะ', nowrap: true, render: (r) => <StatusChip map={PLACEMENT_STATUS} value={r.status} /> },
        { key: 'supervisions', label: 'นิเทศ', render: (r) => `${r.supervisions}/2` },
        { key: 'docs', label: 'เอกสารอนุมัติ', render: (r) => `${r.docsApproved}/${r.docsTotal}` },
        { key: 'employerScore', label: 'คะแนน สถานประกอบการ', render: (r) => score(r.employerScore) },
        { key: 'advisorScore', label: 'คะแนน อาจารย์นิเทศ', render: (r) => score(r.advisorScore) },
      ]} />
    </div>
  )
}
