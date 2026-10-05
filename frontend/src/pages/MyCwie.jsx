import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Button from '@/components/common/Button'
import PageHeader, { Status } from '@/components/common/PageHeader'
import FormModal from '@/components/form/FormModal'
import { useTheme } from '@/context/ThemeContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { brand } from '@/styles/theme'
import PlacementDetail from './placements/PlacementDetail'
import { optionsOf } from './placements/PlacementList'

// นักศึกษา: ยังไม่มีรายการ (หรือถูกตีกลับ) -> ยื่นสมัคร, มีแล้ว -> แสดงรายละเอียด/สถานะ
export default function MyCwie() {
  const { t } = useTheme()
  const { data, loading, error, reload } = useApi('/placements')
  const companies = useApi('/companies')
  const [applying, setApplying] = useState(false)

  if (!data) return <Status loading={loading} error={error} />
  const current = data.find((p) => p.status !== 'rejected')
  const rejected = !current && data[0]

  if (current) return <PlacementDetail id={current.id} />

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="การฝึก CWIE ของฉัน" subtitle="ยื่นสมัครเข้าร่วมโครงการสหกิจศึกษาและการศึกษาเชิงบูรณาการกับการทำงาน (CWIE)" />
      <Panel style={{ padding: 24, display: 'grid', gap: 14 }}>
        {rejected && (
          <div style={{ background: '#A3162114', border: '1px solid #A3162140', color: brand.bright, borderRadius: 10, padding: 12, fontSize: 14 }}>
            ใบสมัครครั้งก่อน ({rejected.company?.name}) ถูกตีกลับ: {rejected.history.at(-1)?.note || '-'}
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 600 }}>ขั้นตอนการเข้าร่วม CWIE</div>
        <ol style={{ margin: 0, paddingLeft: 20, color: t.muted, fontSize: 14, lineHeight: 1.9 }}>
          <li>ดูข้อมูล<Link to="/companies" style={{ color: brand.bright }}>สถานประกอบการ</Link> แล้วยื่นสมัคร</li>
          <li>ส่งเอกสารใบสมัครที่เมนู <Link to="/documents" style={{ color: brand.bright }}>เอกสารของฉัน</Link> (ดาวน์โหลดแบบฟอร์มได้ที่ <Link to="/forms" style={{ color: brand.bright }}>ดาวน์โหลดแบบฟอร์ม</Link>)</li>
          <li>อาจารย์ที่ปรึกษารับรอง แล้วกองสหกิจศึกษาอนุมัติและมอบหมายอาจารย์นิเทศ</li>
          <li>สถานประกอบการยืนยันการรับ แล้วเริ่มปฏิบัติงาน</li>
        </ol>
        <div><Button icon={Send} onClick={() => setApplying(true)}>ยื่นสมัคร CWIE</Button></div>
      </Panel>

      {applying && (
        <FormModal title="ยื่นสมัครเข้าร่วม CWIE" submitLabel="ยื่นสมัคร" onClose={() => setApplying(false)}
          fields={[
            { key: 'companyId', label: 'สถานประกอบการ', type: 'select', required: true, options: optionsOf(companies.data, (c) => c.name) },
            { key: 'position', label: 'ตำแหน่งงานที่สมัคร', required: true },
            { key: 'startDate', label: 'วันเริ่มปฏิบัติงาน', type: 'date', required: true },
            { key: 'endDate', label: 'วันสิ้นสุด', type: 'date', required: true },
            { key: 'note', label: 'ข้อมูลเพิ่มเติม', type: 'textarea' },
          ]}
          onSubmit={(v) => api.post('/placements', v).then(reload)} />
      )}
    </div>
  )
}
