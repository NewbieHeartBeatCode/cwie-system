import { db } from '../config/db.js'
import { isStaff } from '../config/roles.js'
import { byId } from '../services/user.service.js'
import { audit } from '../services/audit.service.js'
import { handle, httpError } from '../utils/http.js'

// ติดต่อประสานงาน: 1 ห้องสนทนาต่อ 1 สถานประกอบการ คุยกับกองสหกิจ/Admin
function companyIdFor(req) {
  if (req.user.role === 'employer') return req.user.companyId
  if (isStaff(req.user)) return req.query.companyId || req.body?.companyId
  throw httpError(403, 'ไม่มีสิทธิ์')
}

export const list = handle((req, res) => {
  const companyId = companyIdFor(req)
  if (!companyId) throw httpError(400, 'กรุณาเลือกสถานประกอบการ')
  const users = byId(db.users.all())
  res.json(db.messages
    .find((m) => m.companyId === companyId)
    .map((m) => ({ ...m, senderName: users.get(m.senderId)?.fullName || '-', senderRole: users.get(m.senderId)?.role }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
})

// รายการห้องสนทนา (สำหรับกองสหกิจ/Admin)
export const threads = handle((req, res) => {
  const companies = byId(db.companies.all())
  const map = new Map()
  for (const m of db.messages.all()) {
    const t = map.get(m.companyId) || { companyId: m.companyId, companyName: companies.get(m.companyId)?.name || '-', count: 0, last: null }
    t.count++
    if (!t.last || m.createdAt > t.last.createdAt) t.last = m
    map.set(m.companyId, t)
  }
  res.json([...map.values()].sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt)))
})

export const create = handle((req, res) => {
  const companyId = companyIdFor(req)
  const text = (req.body?.text || '').trim()
  if (!companyId || !db.companies.get(companyId)) throw httpError(400, 'กรุณาเลือกสถานประกอบการ')
  if (!text) throw httpError(400, 'กรุณาพิมพ์ข้อความ')
  const m = db.messages.insert({ companyId, senderId: req.user.id, text })
  audit(req.user, `ส่งข้อความประสานงาน (${db.companies.get(companyId).name})`)
  res.status(201).json(m)
})
