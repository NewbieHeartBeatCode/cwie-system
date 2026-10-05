import { useState } from 'react'
import { Plus } from 'lucide-react'
import Table from '@/components/common/Table'
import Chip from '@/components/common/Chip'
import Button from '@/components/common/Button'
import PageHeader from '@/components/common/PageHeader'
import FilterBar, { matches } from '@/components/common/FilterBar'
import FormModal from '@/components/form/FormModal'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { ROLES, OFFICE_MANAGED_ROLES, PROGRAMS, isStaff } from '@/utils/labels'
import { formatDate } from '@/utils/format'
import { optionsOf } from './placements/PlacementList'

const TITLES = {
  admin:     ['ผู้ใช้งาน', 'เพิ่ม แก้ไข ลบ ระงับบัญชี และกำหนดบทบาท (สิทธิ์) ของผู้ใช้ทุกบทบาท'],
  office:    ['ผู้ใช้งาน', 'จัดการข้อมูลนักศึกษา อาจารย์นิเทศ อาจารย์ที่ปรึกษา และสถานประกอบการ'],
  advisor:   ['รายชื่อผู้ใช้ที่เกี่ยวข้อง', 'นักศึกษาที่รับผิดชอบ อาจารย์ที่ปรึกษา และสถานประกอบการที่เกี่ยวข้อง'],
  counselor: ['รายชื่อนักศึกษา', 'นักศึกษาในความดูแล และผู้ที่เกี่ยวข้อง'],
  employer:  ['รายชื่อผู้ใช้ที่เกี่ยวข้อง', 'นักศึกษาที่เข้าปฏิบัติงานและอาจารย์ที่ดูแล'],
}

export default function Users() {
  const { t } = useTheme()
  const { user, role } = useAuth()
  const { data, loading, error, reload } = useApi('/users')
  const companies = useApi(isStaff(role) ? '/companies' : null)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState(role === 'counselor' ? 'student' : '')
  const [modal, setModal] = useState(null)
  const staff = isStaff(role)
  const manageable = role === 'admin' ? Object.keys(ROLES) : OFFICE_MANAGED_ROLES
  const canManage = (u) => staff && manageable.includes(u.role)

  const rows = data?.filter((u) => (!roleFilter || u.role === roleFilter) &&
    matches(q, u.fullName, u.email, u.studentId, u.companyName, u.program))

  const form = (u) => ({
    title: u ? `แก้ไขผู้ใช้: ${u.fullName}` : 'เพิ่มผู้ใช้',
    initial: u ? { ...u, password: '' } : { role: manageable[0], status: 'active' },
    fields: [
      { key: 'role', label: 'บทบาท (สิทธิ์การใช้งาน)', type: 'select', required: true, placeholder: false,
        options: manageable.map((r) => ({ value: r, label: ROLES[r] })) },
      { key: 'fullName', label: 'ชื่อ-นามสกุล', required: true },
      { key: 'email', label: 'อีเมล (ใช้เข้าสู่ระบบ)', type: 'email', required: true },
      { key: 'phone', label: 'เบอร์โทร' },
      { key: 'studentId', label: 'รหัสนักศึกษา', required: true, hidden: (v) => v.role !== 'student' },
      { key: 'program', label: 'สาขาวิชา', type: 'select', hidden: (v) => v.role !== 'student',
        options: PROGRAMS.map((p) => ({ value: p, label: p })) },
      { key: 'counselorId', label: 'อาจารย์ที่ปรึกษา', type: 'select', hidden: (v) => v.role !== 'student',
        options: optionsOf(data?.filter((x) => x.role === 'counselor')) },
      { key: 'companyId', label: 'สถานประกอบการ', type: 'select', hidden: (v) => v.role !== 'employer',
        options: optionsOf(companies.data, (c) => c.name) },
      ...(u ? [{ key: 'status', label: 'สถานะบัญชี', type: 'select', placeholder: false,
        options: [{ value: 'active', label: 'ใช้งานได้' }, { value: 'suspended', label: 'ระงับการใช้งาน' }] }] : []),
      { key: 'password', label: u ? 'ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)' : 'รหัสผ่าน', type: 'password', required: !u },
    ],
    onSubmit: (v) => {
      const body = { ...v, counselorId: v.counselorId || null, companyId: v.companyId || null }
      if (u && !body.password) delete body.password
      return (u ? api.put(`/users/${u.id}`, body) : api.post('/users', body)).then(reload)
    },
  })

  const remove = async (u) => {
    if (!confirm(`ลบบัญชี ${u.fullName} ? (ลบแล้วกู้คืนไม่ได้)`)) return
    await api.del(`/users/${u.id}`).catch((e) => alert(e.message))
    reload()
  }

  const [title, subtitle] = TITLES[role]
  return (
    <div style={{ maxWidth: 1180 }}>
      <PageHeader title={title} subtitle={subtitle}
        actions={staff && <Button icon={Plus} onClick={() => setModal(form())}>เพิ่มผู้ใช้</Button>} />
      <FilterBar search={q} onSearch={setQ} onFilter={(_, v) => setRoleFilter(v)}
        filters={[{ key: 'role', label: 'บทบาท', value: roleFilter, options: Object.entries(ROLES).map(([value, label]) => ({ value, label })) }]} />

      <Table loading={loading} error={error} rows={rows} empty="ไม่พบผู้ใช้"
        onRowClick={staff ? (u) => canManage(u) && setModal(form(u)) : undefined}
        columns={[
          { key: 'fullName', label: 'ชื่อ-นามสกุล', render: (u) => (
            <div><div style={{ fontWeight: 600 }}>{u.fullName}{u.id === user.id && ' (คุณ)'}</div>
              <div style={{ fontSize: 12.5, color: t.muted }}>{u.email}</div></div>) },
          { key: 'role', label: 'บทบาท', nowrap: true, render: (u) => <Chip tone={u.role === 'admin' ? 'warn' : 'run'}>{ROLES[u.role]}</Chip> },
          { key: 'info', label: 'ข้อมูลเพิ่มเติม', render: (u) => (
            <span style={{ fontSize: 13.5, color: t.muted }}>
              {u.role === 'student' ? `${u.studentId} · ${u.program || '-'}${u.counselorName ? ` · ที่ปรึกษา: ${u.counselorName}` : ''}`
                : u.role === 'employer' ? u.companyName || '-' : u.phone || '-'}
            </span>) },
          { key: 'status', label: 'สถานะ', nowrap: true, render: (u) => <Chip tone={u.status === 'suspended' ? 'bad' : 'ok'}>{u.status === 'suspended' ? 'ระงับ' : 'ใช้งานได้'}</Chip> },
          { key: 'createdAt', label: 'สมัครเมื่อ', nowrap: true, render: (u) => formatDate(u.createdAt) },
          ...(role === 'admin' ? [{ key: 'del', label: '', render: (u) => u.id !== user.id && (
            <Button small variant="ghost" onClick={(e) => { e.stopPropagation(); remove(u) }}>ลบ</Button>) }] : []),
        ]} />
      {staff && <p style={{ fontSize: 13, color: t.muted }}>กดที่แถวเพื่อแก้ไขข้อมูล เปลี่ยนบทบาท ระงับบัญชี หรือตั้งรหัสผ่านใหม่</p>}

      {modal && <FormModal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}
