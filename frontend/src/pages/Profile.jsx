import { useState } from 'react'
import { KeyRound, Pencil } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Button from '@/components/common/Button'
import PageHeader from '@/components/common/PageHeader'
import FormModal from '@/components/form/FormModal'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { brand } from '@/styles/theme'
import { ROLES, PROGRAMS } from '@/utils/labels'
import { formatDate, initialOf } from '@/utils/format'

export default function Profile() {
  const { t } = useTheme()
  const { user, setUser } = useAuth()
  const [modal, setModal] = useState(null)
  const company = useApi(user.companyId ? `/companies/${user.companyId}` : null)
  const student = user.role === 'student'

  const rows = [
    ['ชื่อ-นามสกุล', user.fullName],
    ['บทบาท', ROLES[user.role]],
    ['อีเมล', user.email],
    ['เบอร์โทร', user.phone || '-'],
    ...(student ? [['รหัสนักศึกษา', user.studentId], ['สาขาวิชา', user.program || '-']] : []),
    ...(user.companyId ? [['สถานประกอบการ', company.data?.name || '...']] : []),
    ['เป็นสมาชิกตั้งแต่', formatDate(user.createdAt)],
  ]

  const save = (body) => api.put('/auth/me', body).then(({ user }) => setUser(user))

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="ข้อมูลส่วนตัว" subtitle="ดูและแก้ไขข้อมูลของคุณ"
        actions={<>
          <Button variant="secondary" icon={KeyRound} onClick={() => setModal('password')}>เปลี่ยนรหัสผ่าน</Button>
          <Button icon={Pencil} onClick={() => setModal('edit')}>แก้ไขข้อมูล</Button>
        </>} />
      <Panel style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: brand.oxblood, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 700 }}>
            {initialOf(user.fullName)}
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{user.fullName}</div>
            <div style={{ color: t.muted, fontSize: 14 }}>{ROLES[user.role]}</div>
          </div>
        </div>
        <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 180px) 1fr', gap: '12px 16px', margin: 0, fontSize: 14.5 }}>
          {rows.map(([k, v]) => [
            <dt key={k} style={{ color: t.muted }}>{k}</dt>,
            <dd key={k + 'v'} style={{ margin: 0, fontWeight: 500, wordBreak: 'break-word' }}>{v}</dd>,
          ])}
        </dl>
      </Panel>

      {modal === 'edit' && (
        <FormModal title="แก้ไขข้อมูลส่วนตัว" initial={user} onClose={() => setModal(null)} onSubmit={save}
          fields={[
            { key: 'fullName', label: 'ชื่อ-นามสกุล', required: true },
            { key: 'phone', label: 'เบอร์โทร' },
            ...(student ? [{ key: 'program', label: 'สาขาวิชา', type: 'select', options: PROGRAMS.map((p) => ({ value: p, label: p })) }] : []),
          ]} />
      )}
      {modal === 'password' && (
        <FormModal title="เปลี่ยนรหัสผ่าน" submitLabel="เปลี่ยนรหัสผ่าน" onClose={() => setModal(null)}
          fields={[
            { key: 'currentPassword', label: 'รหัสผ่านปัจจุบัน', type: 'password', required: true },
            { key: 'newPassword', label: 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)', type: 'password', required: true },
            { key: 'confirm', label: 'ยืนยันรหัสผ่านใหม่', type: 'password', required: true },
          ]}
          onSubmit={({ confirm, ...v }) => {
            if (confirm !== v.newPassword) return Promise.reject(new Error('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน'))
            return save(v)
          }} />
      )}
    </div>
  )
}
