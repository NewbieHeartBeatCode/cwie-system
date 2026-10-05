import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import AdminLayout from '@/layouts/AdminLayout'
import AppRoutes from '@/routes'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Pretest from '@/pages/Pretest'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  )
}

// ยังไม่ login -> หน้า login/สมัคร, login แล้ว -> เข้าระบบ
function Gate() {
  const { user, loading } = useAuth()
  const [screen, setScreen] = useState('login')

  // โหมดทดสอบเปิดทุกบทบาทพร้อมกัน (เปิดให้ใช้ตอนพรีเซนต์ได้เลย)
  if (location.pathname === '/pretest') return <Pretest />
  if (loading) return null
  if (!user) {
    return screen === 'login'
      ? <Login onRegister={() => setScreen('register')} />
      : <Register onLogin={() => setScreen('login')} />
  }

  return (
    <BrowserRouter>
      <AdminLayout>
        <AppRoutes />
      </AdminLayout>
    </BrowserRouter>
  )
}
