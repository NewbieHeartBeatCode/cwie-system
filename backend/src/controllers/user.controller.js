import { db } from '../config/db.js'
import { ROLES, OFFICE_MANAGED_ROLES, isStaff } from '../config/roles.js'
import { createUser, toPublic, byId } from '../services/user.service.js'
import { visiblePlacements, visibleStudentIds } from '../services/scope.service.js'
import { audit } from '../services/audit.service.js'
import { hashPassword } from '../utils/password.js'
import { handle, httpError, pick } from '../utils/http.js'

// Admin จัดการได้ทุก role, กองสหกิจจัดการได้เฉพาะ นักศึกษา/อาจารย์/สถานประกอบการ
const canManage = (actor, role) => actor.role === 'admin' || (actor.role === 'office' && OFFICE_MANAGED_ROLES.includes(role))

// ผู้ใช้ที่เกี่ยวข้องกับคนที่ login (Admin/กองสหกิจเห็นทั้งหมด)
function relatedIds(user) {
  const placements = visiblePlacements(user)
  const ids = new Set(visibleStudentIds(user))
  const companyIds = new Set()
  for (const p of placements) {
    ;[p.advisorId, p.counselorId].forEach((id) => id && ids.add(id))
    if (p.companyId) companyIds.add(p.companyId)
  }
  db.users.find((u) => u.role === 'employer' && companyIds.has(u.companyId)).forEach((u) => ids.add(u.id))
  ids.delete(user.id)
  return ids
}

export const list = handle((req, res) => {
  let rows = db.users.all()
  if (!isStaff(req.user)) {
    const ids = relatedIds(req.user)
    rows = rows.filter((u) => ids.has(u.id))
  }
  if (req.query.role) rows = rows.filter((u) => u.role === req.query.role)

  const users = byId(db.users.all())
  const companies = byId(db.companies.all())
  res.json(rows.map((u) => ({
    ...toPublic(u),
    companyName: companies.get(u.companyId)?.name || null,
    counselorName: users.get(u.counselorId)?.fullName || null,
  })))
})

export const create = handle((req, res) => {
  const b = req.body || {}
  if (!ROLES[b.role]) throw httpError(400, 'บทบาทไม่ถูกต้อง')
  if (!canManage(req.user, b.role)) throw httpError(403, 'ไม่มีสิทธิ์สร้างบัญชีบทบาทนี้')
  if (!b.fullName?.trim() || !b.email?.trim()) throw httpError(400, 'กรุณากรอกชื่อและอีเมล')
  if (!b.password || b.password.length < 6) throw httpError(400, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
  if (b.role === 'student' && !b.studentId?.trim()) throw httpError(400, 'กรุณากรอกรหัสนักศึกษา')
  const user = createUser(pick(b, ['fullName', 'email', 'password', 'role', 'phone', 'studentId', 'program', 'counselorId', 'companyId']))
  audit(req.user, `เพิ่มผู้ใช้ ${user.fullName} (${ROLES[user.role]})`)
  res.status(201).json(user)
})

export const update = handle((req, res) => {
  const target = db.users.get(req.params.id)
  if (!target) throw httpError(404, 'ไม่พบผู้ใช้')
  const b = req.body || {}
  if (!canManage(req.user, target.role)) throw httpError(403, 'ไม่มีสิทธิ์แก้ไขผู้ใช้นี้')

  const patch = pick(b, ['fullName', 'phone', 'studentId', 'program', 'counselorId', 'companyId', 'status'])
  if (b.email) {
    const email = b.email.trim().toLowerCase()
    if (db.users.findOne((u) => u.email === email && u.id !== target.id)) throw httpError(409, 'อีเมลนี้ถูกใช้แล้ว')
    patch.email = email
  }
  if (b.role && b.role !== target.role) {
    if (!ROLES[b.role] || !canManage(req.user, b.role)) throw httpError(403, 'ไม่มีสิทธิ์กำหนดบทบาทนี้')
    patch.role = b.role
  }
  if (patch.status && !['active', 'suspended'].includes(patch.status)) throw httpError(400, 'สถานะไม่ถูกต้อง')
  if (target.id === req.user.id && (patch.status === 'suspended' || patch.role)) throw httpError(400, 'เปลี่ยนสิทธิ์หรือระงับบัญชีตัวเองไม่ได้')
  if (b.password) {
    if (b.password.length < 6) throw httpError(400, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    patch.passwordHash = hashPassword(b.password)
  }

  const user = db.users.update(target.id, patch)
  const what = patch.status === 'suspended' ? 'ระงับบัญชี' : patch.status === 'active' && target.status === 'suspended' ? 'เปิดใช้งานบัญชี' : 'แก้ไขข้อมูลผู้ใช้'
  audit(req.user, `${what} ${user.fullName}`)
  res.json(toPublic(user))
})

export const remove = handle((req, res) => {
  const target = db.users.get(req.params.id)
  if (!target) throw httpError(404, 'ไม่พบผู้ใช้')
  if (target.id === req.user.id) throw httpError(400, 'ลบบัญชีตัวเองไม่ได้')
  if (db.placements.count((p) => [p.studentId, p.advisorId, p.counselorId].includes(target.id))) {
    throw httpError(400, 'ผู้ใช้นี้มีข้อมูลการออกฝึกอยู่ ให้ใช้ "ระงับบัญชี" แทนการลบ')
  }
  db.users.remove(target.id)
  audit(req.user, `ลบผู้ใช้ ${target.fullName} (${ROLES[target.role]})`)
  res.json({ ok: true })
})
