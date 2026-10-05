import { useState } from 'react'
import { ChevronDown, ChevronRight, Download, FileText } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Chip, { StatusChip } from '@/components/common/Chip'
import Button from '@/components/common/Button'
import Timeline from '@/components/common/Timeline'
import { Status } from '@/components/common/PageHeader'
import FormModal from '@/components/form/FormModal'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { DOC_STATUS, STAGES, isStaff } from '@/utils/labels'
import { formatDateTime, formatSize } from '@/utils/format'

const REVIEWERS = ['advisor', 'counselor', 'employer']
const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip'

// รายการเอกสาร + ขั้นตอน ตรวจสอบ / รับรอง / อนุมัติ / ตีกลับ / ส่งแก้ไข ตามสิทธิ์ของผู้ใช้
export default function DocumentList({ docs, reload, loading, error, showStudent = true, empty = 'ยังไม่มีเอกสาร' }) {
  const { t } = useTheme()
  const { user } = useAuth()
  const [open, setOpen] = useState(null)
  const [modal, setModal] = useState(null)
  const staff = isStaff(user.role)

  const actionsFor = (d) => {
    const mine = user.role === 'student' && d.studentId === user.id
    const reviewing = ['submitted', 'certified'].includes(d.status)
    return {
      certify: REVIEWERS.includes(user.role) && d.status === 'submitted',
      approve: staff && reviewing,
      return: (staff || REVIEWERS.includes(user.role)) && reviewing,
      resubmit: mine && ['returned', 'submitted'].includes(d.status),
      remove: (mine && d.status !== 'approved') || user.role === 'admin',
    }
  }

  const review = (d, action) => (v) => api.put(`/documents/${d.id}/review`, { action, note: v.note }).then(reload)
  const download = (d) => api.download(`/documents/${d.id}/file`, d.fileName).catch((e) => alert(e.message))
  const remove = async (d) => {
    if (!confirm(`ลบเอกสาร "${d.title}" ?`)) return
    await api.del(`/documents/${d.id}`).catch((e) => alert(e.message))
    reload()
  }

  return (
    <Panel style={{ padding: 0 }}>
      <Status loading={loading && !docs} error={error} empty={docs?.length === 0 && empty}>
        {docs?.map((d, i) => {
          const a = actionsFor(d)
          const expanded = open === d.id
          const last = d.history.at(-1)
          return (
            <div key={d.id} style={{ borderBottom: i < docs.length - 1 ? `1px solid ${t.line}` : 'none' }}>
              <button onClick={() => setOpen(expanded ? null : d.id)} aria-expanded={expanded}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', color: t.ink, textAlign: 'left', cursor: 'pointer' }}>
                {expanded ? <ChevronDown size={18} color={t.muted} /> : <ChevronRight size={18} color={t.muted} />}
                <FileText size={20} color={t.muted} style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{d.title}</div>
                  <div style={{ fontSize: 12.5, color: t.muted }}>
                    {showStudent && <>{d.studentName} ({d.studentCode}) · </>}
                    {last?.action} · {formatDateTime(last?.at)}
                  </div>
                </div>
                <Chip>{STAGES[d.stage]}</Chip>
                <StatusChip map={DOC_STATUS} value={d.status} />
              </button>

              {expanded && (
                <div style={{ padding: '4px 18px 18px 58px', display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button small variant="secondary" icon={Download} onClick={() => download(d)}>{d.fileName}</Button>
                    <span style={{ fontSize: 12.5, color: t.muted }}>{formatSize(d.size)}</span>
                    <span style={{ flex: 1 }} />
                    {a.certify && <Button small onClick={() => setModal({ title: 'ตรวจสอบและรับรองเอกสาร', submitLabel: 'รับรองเอกสาร', note: false, run: review(d, 'certify') })}>ตรวจสอบ/รับรอง</Button>}
                    {a.approve && <Button small onClick={() => setModal({ title: 'อนุมัติเอกสาร', submitLabel: 'อนุมัติ', note: false, run: review(d, 'approve') })}>อนุมัติ</Button>}
                    {a.return && <Button small variant="danger" onClick={() => setModal({ title: 'ตีกลับให้แก้ไข', submitLabel: 'ตีกลับ', note: true, danger: true, run: review(d, 'return') })}>ตีกลับ</Button>}
                    {a.resubmit && <Button small variant="secondary" onClick={() => setModal({ resubmit: d })}>ส่งฉบับแก้ไข</Button>}
                    {a.remove && <Button small variant="ghost" onClick={() => remove(d)}>ลบ</Button>}
                  </div>
                  <Timeline items={d.history} />
                </div>
              )}
            </div>
          )
        })}
      </Status>

      {modal && !modal.resubmit && (
        <FormModal title={modal.title} submitLabel={modal.submitLabel} danger={modal.danger} onClose={() => setModal(null)} onSubmit={modal.run}
          fields={[{ key: 'note', label: modal.note ? 'สิ่งที่ต้องแก้ไข' : 'หมายเหตุ (ถ้ามี)', type: 'textarea', required: modal.note }]} />
      )}
      {modal?.resubmit && (
        <FormModal title="ส่งเอกสารฉบับแก้ไข" subtitle={modal.resubmit.title} submitLabel="ส่งเอกสาร" onClose={() => setModal(null)}
          fields={[
            { key: 'file', label: 'ไฟล์ฉบับแก้ไข', type: 'file', accept: ACCEPT, required: true, help: 'PDF, Word, Excel, รูปภาพ หรือ ZIP ไม่เกิน 10 MB' },
            { key: 'note', label: 'สิ่งที่แก้ไข', type: 'textarea' },
          ]}
          onSubmit={(v) => {
            const fd = new FormData()
            fd.append('file', v.file)
            fd.append('note', v.note)
            return api.upload(`/documents/${modal.resubmit.id}/file`, fd, 'PUT').then(reload)
          }} />
      )}
    </Panel>
  )
}

export { ACCEPT }
