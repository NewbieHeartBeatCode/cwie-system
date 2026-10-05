import { useState } from 'react'
import { CalendarDays, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Chip from '@/components/common/Chip'
import Button from '@/components/common/Button'
import PageHeader, { Status } from '@/components/common/PageHeader'
import FilterBar from '@/components/common/FilterBar'
import FormModal from '@/components/form/FormModal'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { brand } from '@/styles/theme'
import { KINDS, isStaff } from '@/utils/labels'
import { formatDate, today } from '@/utils/format'

// ประกาศ/กำหนดการ: กองสหกิจประกาศถึงทุกคน, สถานประกอบการกำหนดการสำหรับนักศึกษาของตัวเอง
export default function Announcements() {
  const { t } = useTheme()
  const { user, role } = useAuth()
  const [kind, setKind] = useState('')
  const [modal, setModal] = useState(null)
  const { data, loading, error, reload } = useApi('/announcements')
  const canCreate = isStaff(role) || role === 'employer'
  const canEdit = (a) => isStaff(role) || a.authorId === user.id
  const rows = data?.filter((a) => !kind || a.kind === kind)
  const upcoming = today()

  const remove = async (a) => {
    if (!confirm(`ลบ "${a.title}" ?`)) return
    await api.del(`/announcements/${a.id}`).catch((e) => alert(e.message))
    reload()
  }

  const form = (a) => ({
    title: a ? 'แก้ไข' : role === 'employer' ? 'เพิ่มกำหนดการสำหรับนักศึกษา' : 'เพิ่มประกาศ / กำหนดการ',
    initial: a || { kind: role === 'employer' ? 'schedule' : 'announcement', date: today() },
    fields: [
      { key: 'kind', label: 'ประเภท', type: 'select', placeholder: false, options: Object.entries(KINDS).map(([value, label]) => ({ value, label })) },
      { key: 'title', label: 'หัวข้อ', required: true },
      { key: 'date', label: 'วันที่', type: 'date', required: true },
      { key: 'detail', label: 'รายละเอียด', type: 'textarea', rows: 4 },
    ],
    onSubmit: (v) => (a ? api.put(`/announcements/${a.id}`, v) : api.post('/announcements', v)).then(reload),
  })

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="ประกาศและกำหนดการ" subtitle={role === 'employer' ? 'ประกาศจากมหาวิทยาลัย และกำหนดการที่คุณแจ้งนักศึกษา' : 'ข่าวประกาศและกำหนดการที่เกี่ยวข้องกับ CWIE'}
        actions={canCreate && <Button icon={Plus} onClick={() => setModal(form())}>{role === 'employer' ? 'เพิ่มกำหนดการ' : 'เพิ่มประกาศ'}</Button>} />
      <FilterBar onFilter={(_, v) => setKind(v)} filters={[{ key: 'kind', label: 'ประเภท', value: kind, options: Object.entries(KINDS).map(([value, label]) => ({ value, label })) }]} />

      <Status loading={loading} error={error} empty={rows?.length === 0 && 'ยังไม่มีประกาศ'}>
        <div style={{ display: 'grid', gap: 12 }}>
          {rows?.map((a) => (
            <Panel key={a.id} style={{ padding: 18, display: 'flex', gap: 14, opacity: a.kind === 'schedule' && a.date < upcoming ? 0.65 : 1 }}>
              <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 11, background: brand.oxblood + '16', color: brand.bright, display: 'grid', placeItems: 'center' }}>
                {a.kind === 'schedule' ? <CalendarDays size={21} /> : <Megaphone size={21} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 15.5 }}>{a.title}</span>
                  <Chip tone={a.kind === 'schedule' ? 'run' : 'idle'}>{KINDS[a.kind]}</Chip>
                  {a.companyName && <Chip>{a.companyName}</Chip>}
                </div>
                <div style={{ fontSize: 13, color: t.muted, margin: '3px 0 6px' }}>{formatDate(a.date)} · โดย {a.authorName}</div>
                {a.detail && <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{a.detail}</div>}
              </div>
              {canEdit(a) && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                  <Button small variant="ghost" icon={Pencil} onClick={() => setModal(form(a))} aria-label="แก้ไข" />
                  <Button small variant="ghost" icon={Trash2} onClick={() => remove(a)} aria-label="ลบ" />
                </div>
              )}
            </Panel>
          ))}
        </div>
      </Status>

      {modal && <FormModal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}
