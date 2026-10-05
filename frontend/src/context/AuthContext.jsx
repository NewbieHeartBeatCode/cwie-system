import { createContext, useContext, useEffect, useState } from 'react'
import { api, tokenStore, pretestRole } from '@/services/api'
import { PRETEST_PASSWORD, pretestEmail } from '@/utils/pretest'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!tokenStore.get() || !!pretestRole)
  const [autoLoginError, setAutoLoginError] = useState('')

  const login = async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password })
    tokenStore.set(token)
    setUser(user)
  }

  useEffect(() => {
    // โหมดทดสอบ: login เป็น role ของกรอบนี้อัตโนมัติ
    if (pretestRole && !tokenStore.get()) {
      login(pretestEmail(pretestRole), PRETEST_PASSWORD)
        .catch((e) => setAutoLoginError(`${e.message} — ลองรัน "npm run seed" ใน backend`))
        .finally(() => setLoading(false))
      return
    }
    // มี token ค้างอยู่ -> ถาม backend ว่ายังใช้ได้ไหม
    if (!tokenStore.get()) return
    api.get('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const logout = () => {
    tokenStore.clear()
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, role: user?.role, loading, login, logout, setUser, autoLoginError }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
