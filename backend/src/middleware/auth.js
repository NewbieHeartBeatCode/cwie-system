import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { db } from '../config/db.js'
import { toPublic } from '../services/user.service.js'

// ตรวจ token + โหลดผู้ใช้จริงจากไฟล์ (บัญชีที่ถูกระงับ/ลบ ใช้ token เดิมต่อไม่ได้)
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  let payload
  try {
    payload = jwt.verify(header.replace(/^Bearer /, ''), env.jwtSecret)
  } catch {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })
  }
  const user = db.users.get(payload.sub)
  if (!user) return res.status(401).json({ message: 'ไม่พบผู้ใช้' })
  if (user.status === 'suspended') return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน' })
  req.user = toPublic(user)
  next()
}

// ใช้ต่อจาก requireAuth
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' })
