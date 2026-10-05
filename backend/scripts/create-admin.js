// สร้างบัญชีผู้ดูแลระบบ (admin สมัครผ่านหน้าเว็บไม่ได้)
// ใช้: npm run create-admin -- <อีเมล> <รหัสผ่าน> "<ชื่อ-นามสกุล>"
import { createUser } from '../src/services/user.service.js'

const [email, password, fullName = 'ผู้ดูแลระบบ'] = process.argv.slice(2)
if (!email || !password || password.length < 6) {
  console.error('ใช้: npm run create-admin -- <อีเมล> <รหัสผ่านอย่างน้อย 6 ตัว> "<ชื่อ-นามสกุล>"')
  process.exit(1)
}

try {
  const user = createUser({ fullName, email, password, role: 'admin' })
  console.log(`สร้าง admin สำเร็จ: ${user.email}`)
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
