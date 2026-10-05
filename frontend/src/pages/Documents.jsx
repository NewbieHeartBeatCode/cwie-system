import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import FilterBar, { useUrlFilters, matches } from '@/components/common/FilterBar'
import FormModal from '@/components/form/FormModal'
import DocumentList, { ACCEPT } from '@/components/DocumentList'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { DOC_STATUS, STAGES } from '@/utils/labels'

const toOptions = (map) => Object.entries(map).map(([value, v]) => ({ value, label: v.label || v }))

export default function Documents() {
  const { role } = useAuth()
  const [params, setParams] = useSearchParams()
  const filter = useUrlFilters(params, setParams)
  const [q, setQ] = useState('')
  const [uploading, setUploading] = useState(false)
  const { data, loading, error, reload } = useApi('/documents')
  const forms = useApi(role === 'student' ? '/forms' : null)

  const student = role === 'student'
  const rows = data?.filter((d) =>
    (!filter.get('stage') || d.stage === filter.get('stage')) &&
    (!filter.get('status') || d.status === filter.get('status')) &&
    matches(q, d.title, d.studentName, d.studentCode, d.fileName))

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader
        title={student ? 'เอกสารของฉัน' : 'เอกสาร'}
        subtitle={student
          ? 'ส่งเอกสาร ตรวจสอบสถานะ และส่งฉบับแก้ไขเมื่อถูกตีกลับ'
          : 'ขั้นตอน: อัปโหลด, ตรวจสอบ/รับรอง, อนุมัติ หรือตีกลับให้แก้ไข (กดที่เอกสารเพื่อดูประวัติและดำเนินการ)'}
        actions={student && <Button icon={Upload} onClick={() => setUploading(true)}>ส่งเอกสาร</Button>} />

      <FilterBar search={q} onSearch={setQ} onFilter={filter.set} filters={[
        { key: 'stage', label: 'ช่วง', value: filter.get('stage'), options: toOptions(STAGES) },
        { key: 'status', label: 'สถานะ', value: filter.get('status'), options: toOptions(DOC_STATUS) },
      ]} />

      <DocumentList docs={rows} reload={reload} loading={loading} error={error} showStudent={!student}
        empty={data?.length ? 'ไม่พบเอกสารตามเงื่อนไข' : 'ยังไม่มีเอกสาร'} />

      {uploading && (
        <FormModal title="ส่งเอกสาร" submitLabel="อัปโหลด" onClose={() => setUploading(false)}
          fields={[
            { key: 'title', label: 'ชื่อเอกสาร', required: true, help: forms.data?.length ? 'เช่น ' + forms.data.slice(0, 2).map((f) => f.title).join(', ') : undefined },
            { key: 'stage', label: 'ช่วงของเอกสาร', type: 'select', required: true, options: toOptions(STAGES) },
            { key: 'file', label: 'ไฟล์', type: 'file', accept: ACCEPT, required: true, help: 'PDF, Word, Excel, รูปภาพ หรือ ZIP ไม่เกิน 10 MB' },
          ]}
          onSubmit={(v) => {
            const fd = new FormData()
            Object.entries(v).forEach(([k, val]) => fd.append(k, val))
            return api.upload('/documents', fd).then(reload)
          }} />
      )}
    </div>
  )
}
