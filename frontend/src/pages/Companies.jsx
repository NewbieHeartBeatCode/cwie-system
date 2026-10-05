import { useState } from 'react'
import { Building2, Globe, Mail, MapPin, Pencil, Phone, Plus, User } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Chip from '@/components/common/Chip'
import Button from '@/components/common/Button'
import PageHeader, { Status } from '@/components/common/PageHeader'
import FilterBar, { matches } from '@/components/common/FilterBar'
import FormModal from '@/components/form/FormModal'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { isStaff } from '@/utils/labels'

const FIELDS = [
  { key: 'name', label: 'ชื่อสถานประกอบการ', required: true },
  { key: 'description', label: 'ลักษณะงาน / ธุรกิจ', type: 'textarea' },
  { key: 'address', label: 'ที่อยู่', type: 'textarea', rows: 2 },
  { key: 'contactName', label: 'ผู้ประสานงาน' },
  { key: 'phone', label: 'เบอร์โทร' },
  { key: 'email', label: 'อีเมล', type: 'email' },
  { key: 'website', label: 'เว็บไซต์' },
]

// สถานประกอบการ: กองสหกิจ/Admin จัดการและตรวจสอบ, สถานประกอบการแก้ข้อมูลของตัวเอง, คนอื่นดูอย่างเดียว
export default function Companies() {
  const { user, role } = useAuth()
  const { data, loading, error, reload } = useApi('/companies')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)
  const staff = isStaff(role)
  const employer = role === 'employer'

  const edit = (c) => setModal({
    title: c ? 'แก้ไขข้อมูลสถานประกอบการ' : 'เพิ่มสถานประกอบการ', initial: c || {}, fields: FIELDS,
    onSubmit: (v) => (c ? api.put(`/companies/${c.id}`, v) : api.post('/companies', v)).then(reload),
  })
  const verify = (c) => api.put(`/companies/${c.id}/verify`, { verified: !c.verified }).then(reload).catch((e) => alert(e.message))
  const remove = async (c) => {
    if (!confirm(`ลบ ${c.name} ?`)) return
    await api.del(`/companies/${c.id}`).catch((e) => alert(e.message))
    reload()
  }

  const rows = data?.filter((c) => (!employer || c.id === user.companyId) && matches(q, c.name, c.description, c.address))

  return (
    <div style={{ maxWidth: 1100 }}>
      <PageHeader
        title={employer ? 'ข้อมูลสถานประกอบการ' : 'สถานประกอบการ'}
        subtitle={employer ? 'ข้อมูลนี้นักศึกษาและมหาวิทยาลัยจะเห็น' : staff ? 'ตรวจสอบ เพิ่ม และแก้ไขข้อมูลสถานประกอบการ' : 'สถานประกอบการที่ร่วมโครงการ CWIE'}
        actions={staff && <Button icon={Plus} onClick={() => edit()}>เพิ่มสถานประกอบการ</Button>} />
      {!employer && <FilterBar search={q} onSearch={setQ} />}

      <Status loading={loading} error={error} empty={rows?.length === 0 && 'ไม่พบสถานประกอบการ'}>
        <div style={{ display: 'grid', gridTemplateColumns: employer ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {rows?.map((c) => (
            <CompanyCard key={c.id} c={c}
              actions={<>
                {(staff || employer) && <Button small variant="secondary" icon={Pencil} onClick={() => edit(c)}>แก้ไข</Button>}
                {staff && <Button small variant={c.verified ? 'ghost' : 'primary'} onClick={() => verify(c)}>{c.verified ? 'ยกเลิกการรับรอง' : 'ตรวจสอบแล้ว / รับรอง'}</Button>}
                {role === 'admin' && <Button small variant="ghost" onClick={() => remove(c)}>ลบ</Button>}
              </>} />
          ))}
        </div>
      </Status>

      {modal && <FormModal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}

function CompanyCard({ c, actions }) {
  const { t } = useTheme()
  const line = (Icon, text) => text && (
    <div style={{ display: 'flex', gap: 8, fontSize: 13.5, color: t.muted }}><Icon size={15} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{text}</span></div>
  )
  return (
    <Panel style={{ padding: 18, display: 'grid', gap: 8, alignContent: 'start' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Building2 size={22} color={t.muted} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15.5 }}>{c.name}</div>
          {c.description && <div style={{ fontSize: 13.5, color: t.muted }}>{c.description}</div>}
        </div>
        <Chip tone={c.verified ? 'ok' : 'warn'}>{c.verified ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}</Chip>
      </div>
      {line(MapPin, c.address)}
      {line(User, c.contactName)}
      {line(Phone, c.phone)}
      {line(Mail, c.email)}
      {line(Globe, c.website)}
      <div style={{ fontSize: 13, color: t.muted }}>นักศึกษากำลังปฏิบัติงาน {c.activeStudents} คน · รวมทั้งหมด {c.totalStudents} คน</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>{actions}</div>
    </Panel>
  )
}
