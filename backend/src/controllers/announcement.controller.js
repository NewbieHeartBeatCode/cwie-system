import { db } from '../config/db.js'
import { isStaff } from '../config/roles.js'
import { visiblePlacements } from '../services/scope.service.js'
import { byId } from '../services/user.service.js'
import { audit } from '../services/audit.service.js'
import { handle, httpError, pick } from '../utils/http.js'

// ประกาศ/กำหนดการ: ของกองสหกิจ (companyId = null) ทุกคนเห็น,
// ของสถานประกอบการ เห็นเฉพาะคนที่เกี่ยวข้องกับสถานประกอบการนั้น
export function visibleAnnouncements(user) {
  const rows = db.announcements.all()
  let list = rows
  if (!isStaff(user)) {
    const companyIds = new Set(visiblePlacements(user).map((p) => p.companyId))
    if (user.companyId) companyIds.add(user.companyId)
    list = rows.filter((a) => !a.companyId || companyIds.has(a.companyId))
  }
  const users = byId(db.users.all())
  const companies = byId(db.companies.all())
  return list
    .map((a) => ({ ...a, authorName: users.get(a.authorId)?.fullName || '-', companyName: companies.get(a.companyId)?.name || null }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export const list = handle((req, res) => {
  let rows = visibleAnnouncements(req.user)
  if (req.query.kind) rows = rows.filter((a) => a.kind === req.query.kind)
  res.json(rows)
})

function validate(b) {
  if (!b.title?.trim() || !b.date) throw httpError(400, 'กรุณากรอกหัวข้อและวันที่')
  if (b.kind && !['announcement', 'schedule'].includes(b.kind)) throw httpError(400, 'ประเภทไม่ถูกต้อง')
}

const canEdit = (user, a) => isStaff(user) || a.authorId === user.id

export const create = handle((req, res) => {
  const b = req.body || {}
  validate(b)
  const a = db.announcements.insert({
    title: b.title.trim(), detail: b.detail || '', kind: b.kind || 'announcement', date: b.date,
    companyId: req.user.role === 'employer' ? req.user.companyId : null,
    authorId: req.user.id,
  })
  audit(req.user, `เพิ่ม${a.kind === 'schedule' ? 'กำหนดการ' : 'ประกาศ'} "${a.title}"`)
  res.status(201).json(a)
})

export const update = handle((req, res) => {
  const a = db.announcements.get(req.params.id)
  if (!a || !canEdit(req.user, a)) throw httpError(404, 'ไม่พบรายการ หรือไม่มีสิทธิ์แก้ไข')
  const patch = pick(req.body, ['title', 'detail', 'kind', 'date'])
  validate({ ...a, ...patch })
  res.json(db.announcements.update(a.id, patch))
})

export const remove = handle((req, res) => {
  const a = db.announcements.get(req.params.id)
  if (!a || !canEdit(req.user, a)) throw httpError(404, 'ไม่พบรายการ หรือไม่มีสิทธิ์ลบ')
  db.announcements.remove(a.id)
  audit(req.user, `ลบ "${a.title}"`)
  res.json({ ok: true })
})
