import { db } from '../config/db.js'
import { hashPassword } from '../utils/password.js'
import { httpError } from '../utils/http.js'

// ตัด passwordHash ออกก่อนส่งข้อมูลผู้ใช้กลับไป
export function toPublic({ passwordHash, ...user }) {
  return user
}

// ข้อมูลย่อของผู้ใช้ ไว้แนบกับ record อื่น
export const brief = (u) => u && {
  id: u.id, fullName: u.fullName, email: u.email, phone: u.phone || '', role: u.role,
  studentId: u.studentId || null, program: u.program || '',
}

export const byId = (rows) => new Map(rows.map((r) => [r.id, r]))

export function createUser({ fullName, email, password, role, ...extra }) {
  email = String(email || '').trim().toLowerCase()
  if (db.users.findOne((u) => u.email === email)) throw httpError(409, 'อีเมลนี้ถูกใช้แล้ว')
  const user = db.users.insert({
    fullName: String(fullName).trim(),
    email,
    role,
    status: 'active',
    phone: extra.phone || '',
    studentId: role === 'student' ? String(extra.studentId || '').trim() : null,
    program: role === 'student' ? extra.program || '' : '',
    counselorId: role === 'student' ? extra.counselorId || null : null,
    companyId: role === 'employer' ? extra.companyId || null : null,
    passwordHash: hashPassword(password),
    ...(extra.id && { id: extra.id }),
    ...(extra.createdAt && { createdAt: extra.createdAt }),
  })
  return toPublic(user)
}
