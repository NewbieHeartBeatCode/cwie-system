import jwt from 'jsonwebtoken'
import { db } from '../config/db.js'
import { env } from '../config/env.js'
import { ROLES, SELF_REGISTER_ROLES } from '../config/roles.js'
import { createUser, toPublic } from '../services/user.service.js'
import { audit } from '../services/audit.service.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { handle, httpError, pick } from '../utils/http.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// สมัครเองได้: นักศึกษา และสถานประกอบการ (สร้างข้อมูลบริษัทให้พร้อมกัน รอกองสหกิจตรวจสอบ)
export const register = handle((req, res) => {
  const { fullName, email, password, role, studentId, program, phone, companyName } = req.body || {}
  const errors = []
  if (!fullName?.trim()) errors.push('กรุณากรอกชื่อ-นามสกุล')
  if (!EMAIL_RE.test(email || '')) errors.push('อีเมลไม่ถูกต้อง')
  if (!password || password.length < 6) errors.push('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
  if (!SELF_REGISTER_ROLES.includes(role)) errors.push('บทบาทนี้สมัครเองไม่ได้ กรุณาติดต่อกองสหกิจศึกษา')
  if (role === 'student' && !studentId?.trim()) errors.push('กรุณากรอกรหัสนักศึกษา')
  if (role === 'employer' && !companyName?.trim()) errors.push('กรุณากรอกชื่อสถานประกอบการ')
  if (errors.length) return res.status(400).json({ message: errors[0], errors })
  if (db.users.findOne((u) => u.email === email.trim().toLowerCase())) throw httpError(409, 'อีเมลนี้ถูกใช้แล้ว')

  let companyId = null
  if (role === 'employer') {
    companyId = db.companies.insert({
      name: companyName.trim(), address: '', phone: phone || '', email: email.trim().toLowerCase(),
      contactName: fullName.trim(), description: '', verified: false,
    }).id
  }
  const user = createUser({ fullName, email, password, role, studentId, program, phone, companyId })
  audit(user, `สมัครสมาชิก (${ROLES[role]})`)
  res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user })
})

const failCounts = new Map()

export const login = handle((req, res) => {
  const { email = '', password = '' } = req.body || {}
  const key = `${req.ip}:${email.trim().toLowerCase()}`
  
  const fails = failCounts.get(key) || { count: 0, lockUntil: 0 }
  if (fails.lockUntil > Date.now()) {
    throw httpError(429, 'พยายามเข้าสู่ระบบผิดพลาดมากเกินไป กรุณารอสักครู่')
  }

  const user = db.users.findOne((u) => u.email === email.trim().toLowerCase())
  if (!user || !verifyPassword(password, user.passwordHash)) {
    fails.count += 1
    if (fails.count >= 5) {
      fails.lockUntil = Date.now() + 15 * 60 * 1000 // 15 mins lock
    }
    failCounts.set(key, fails)
    throw httpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  }
  
  failCounts.delete(key)
  if (user.status === 'suspended') throw httpError(403, 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ')
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: '8h' })
  res.json({ token, user: toPublic(user) })
})

export const me = (req, res) => res.json({ user: req.user })

// แก้ข้อมูลส่วนตัว + เปลี่ยนรหัสผ่าน
export const updateMe = handle((req, res) => {
  const body = req.body || {}
  const patch = pick(body, ['fullName', 'phone', ...(req.user.role === 'student' ? ['program'] : [])])
  if (patch.fullName !== undefined && !patch.fullName.trim()) throw httpError(400, 'กรุณากรอกชื่อ-นามสกุล')

  if (body.newPassword) {
    const user = db.users.get(req.user.id)
    if (!verifyPassword(body.currentPassword || '', user.passwordHash)) throw httpError(400, 'รหัสผ่านปัจจุบันไม่ถูกต้อง')
    if (body.newPassword.length < 6) throw httpError(400, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
    patch.passwordHash = hashPassword(body.newPassword)
  }
  const user = db.users.update(req.user.id, patch)
  audit(req.user, body.newPassword ? 'แก้ไขข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน' : 'แก้ไขข้อมูลส่วนตัว')
  res.json({ user: toPublic(user) })
})
