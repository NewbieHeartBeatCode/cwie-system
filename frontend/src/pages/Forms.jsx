import { useState } from 'react'
import { Download, FileDown, Plus, Trash2 } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Chip from '@/components/common/Chip'
import Button from '@/components/common/Button'
import PageHeader, { Status } from '@/components/common/PageHeader'
import FormModal from '@/components/form/FormModal'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { STAGES, isStaff } from '@/utils/labels'
import { formatSize } from '@/utils/format'
import { ACCEPT } from '@/components/DocumentList'

// ดาวน์โหลดแบบฟอร์ม (ทุกบทบาท) — กองสหกิจ/Admin เพิ่ม/ลบได้
export default function Forms() {
  const { t } = useTheme()
  const { role } = useAuth()
  const { data, loading, error, reload } = useApi('/forms')
  const [adding, setAdding] = useState(false)
  const staff = isStaff(role)

  const remove = async (f) => {
    if (!confirm(`ลบแบบฟอร์ม "${f.title}" ?`)) return
    await api.del(`/forms/${f.id}`).catch((e) => alert(e.message))
    reload()
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader title="ดาวน์โหลดแบบฟอร์ม" subtitle="แบบฟอร์มที่ใช้ในแต่ละขั้นตอนของ CWIE"
        actions={staff && <Button icon={Plus} onClick={() => setAdding(true)}>เพิ่มแบบฟอร์ม</Button>} />
      <Status loading={loading} error={error} empty={data?.length === 0 && 'ยังไม่มีแบบฟอร์ม'}>
        {Object.entries(STAGES).map(([stage, label]) => {
          const list = data?.filter((f) => f.stage === stage) || []
          if (!list.length) return null
          return (
            <div key={stage} style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, margin: '0 0 10px', color: t.muted, fontWeight: 600 }}>{label}</h2>
              <Panel style={{ padding: 0 }}>
                {list.map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? `1px solid ${t.line}` : 'none', flexWrap: 'wrap' }}>
                    <FileDown size={22} color={t.muted} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{f.title}</div>
                      <div style={{ fontSize: 12.5, color: t.muted }}>{f.description || f.fileName} · {formatSize(f.size)}</div>
                    </div>
                    <Chip>{f.fileName.split('.').pop().toUpperCase()}</Chip>
                    <Button small variant="secondary" icon={Download} onClick={() => api.download(`/forms/${f.id}/file`, f.fileName).catch((e) => alert(e.message))}>ดาวน์โหลด</Button>
                    {staff && <Button small variant="ghost" icon={Trash2} onClick={() => remove(f)} aria-label={`ลบ ${f.title}`} />}
                  </div>
                ))}
              </Panel>
            </div>
          )
        })}
      </Status>

      {adding && (
        <FormModal title="เพิ่มแบบฟอร์ม" submitLabel="อัปโหลด" onClose={() => setAdding(false)}
          fields={[
            { key: 'title', label: 'ชื่อแบบฟอร์ม', required: true },
            { key: 'stage', label: 'ช่วง', type: 'select', required: true, options: Object.entries(STAGES).map(([value, label]) => ({ value, label })) },
            { key: 'description', label: 'คำอธิบาย' },
            { key: 'file', label: 'ไฟล์', type: 'file', accept: ACCEPT, required: true },
          ]}
          onSubmit={(v) => {
            const fd = new FormData()
            Object.entries(v).forEach(([k, val]) => fd.append(k, val))
            return api.upload('/forms', fd).then(reload)
          }} />
      )}
    </div>
  )
}
