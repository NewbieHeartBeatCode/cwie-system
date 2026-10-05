import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { ROLES, SELF_REGISTER_ROLES, PROGRAMS } from '@/utils/labels'
import { inputStyle, Field } from '@/components/form/Field'
import AuthShell, { SubmitButton, ErrorText, SwitchLink } from './AuthShell'

const empty = { fullName: '', role: 'student', studentId: '', program: '', companyName: '', phone: '', email: '', password: '', confirm: '' }

export default function Register({ onLogin }) {
  const { t } = useTheme()
  const { login } = useAuth()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
    setError('')
    setBusy(true)
    try {
      const { confirm, ...data } = form
      await api.post('/auth/register', { ...data, email: data.email.trim() })
      // สมัครเสร็จ login ให้เลย
      await login(data.email.trim(), data.password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell subtitle="สมัครสมาชิกใหม่">
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label="สมัครในฐานะ">
          <select value={form.role} onChange={set('role')} style={inputStyle(t)}>
            {SELF_REGISTER_ROLES.map(r => <option key={r} value={r}>{ROLES[r]}</option>)}
          </select>
        </Field>
        {form.role === 'employer' && (
          <Field label="ชื่อสถานประกอบการ">
            <input required value={form.companyName} onChange={set('companyName')} style={inputStyle(t)} />
          </Field>
        )}
        <Field label={form.role === 'employer' ? 'ชื่อผู้ประสานงาน' : 'ชื่อ-นามสกุล'}>
          <input autoComplete="name" required value={form.fullName} onChange={set('fullName')} style={inputStyle(t)} />
        </Field>
        {form.role === 'student' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="รหัสนักศึกษา">
              <input inputMode="numeric" required value={form.studentId} onChange={set('studentId')} style={inputStyle(t)} />
            </Field>
            <Field label="สาขาวิชา">
              <select required value={form.program} onChange={set('program')} style={inputStyle(t)}>
                <option value="">— เลือก —</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
        )}
        <Field label="อีเมล">
          <input type="email" autoComplete="email" required value={form.email} onChange={set('email')} style={inputStyle(t)} />
        </Field>
        <Field label="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)">
          <input type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={set('password')} style={inputStyle(t)} />
        </Field>
        <Field label="ยืนยันรหัสผ่าน">
          <input type="password" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} style={inputStyle(t)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <SubmitButton busy={busy}>{busy ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</SubmitButton>
        <div style={{ fontSize: 12.5, color: t.muted, textAlign: 'center' }}>
          อาจารย์นิเทศ / อาจารย์ที่ปรึกษา / กองสหกิจศึกษา ขอบัญชีได้จากผู้ดูแลระบบ
        </div>
        <SwitchLink text="มีบัญชีแล้ว?" action="เข้าสู่ระบบ" onClick={onLogin} />
      </form>
    </AuthShell>
  )
}
