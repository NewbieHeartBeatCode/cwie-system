import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { inputStyle, Field } from '@/components/form/Field'
import { UNIVERSITY } from '@/utils/labels'
import AuthShell, { SubmitButton, ErrorText, SwitchLink } from './AuthShell'

export default function Login({ onRegister }) {
  const { t } = useTheme()
  const { login, autoLoginError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell subtitle={`${UNIVERSITY.faculty} ${UNIVERSITY.short} ${UNIVERSITY.campus}`}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label="อีเมล">
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle(t)} />
        </Field>
        <Field label="รหัสผ่าน">
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle(t)} />
        </Field>
        <ErrorText>{error || autoLoginError}</ErrorText>
        <SubmitButton busy={busy}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</SubmitButton>
        <SwitchLink text="ยังไม่มีบัญชี?" action="สมัครสมาชิก" onClick={onRegister} />
        {import.meta.env.DEV && (
          <a href="/pretest" style={{ textAlign: 'center', fontSize: 13, color: t.muted }}>
            โหมดทดสอบ: เปิดทุกบทบาทพร้อมกัน
          </a>
        )}
      </form>
    </AuthShell>
  )
}
