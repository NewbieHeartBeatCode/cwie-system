import { db } from '../config/db.js'
import { isStaff } from '../config/roles.js'
import { toPublic } from '../services/user.service.js'
import { audit } from '../services/audit.service.js'
import { handle, httpError, pick } from '../utils/http.js'

const FIELDS = ['name', 'address', 'phone', 'email', 'contactName', 'website', 'description', 'scope', 'country', 'category']
const SCOPES = ['domestic', 'international']

// ในประเทศไม่ต้องมีประเทศ, นานาชาติต้องระบุประเทศ
const checkScope = (data, current = {}) => {
  const scope = data.scope ?? current.scope ?? 'domestic'
  if (!SCOPES.includes(scope)) throw httpError(400, 'ประเภทสถานประกอบการไม่ถูกต้อง')
  const country = scope === 'domestic' ? '' : (data.country ?? current.country ?? '').trim()
  if (scope === 'international' && !country) throw httpError(400, 'กรุณาระบุประเทศ')
  return { ...data, scope, country }
}

const withCounts = (c) => ({
  ...c,
  scope: c.scope || 'domestic', // ข้อมูลเก่าที่ยังไม่มี scope ถือเป็นในประเทศ
  activeStudents: db.placements.count((p) => p.companyId === c.id && p.status === 'active'),
  totalStudents: db.placements.count((p) => p.companyId === c.id && p.status !== 'rejected'),
})

// นักศึกษาเห็นเฉพาะสถานประกอบการที่ผ่านการตรวจสอบแล้ว
export const list = handle((req, res) => {
  let rows = db.companies.all()
  if (req.user.role === 'student') rows = rows.filter((c) => c.verified)
  res.json(rows.map(withCounts).sort((a, b) => a.name.localeCompare(b.name, 'th')))
})

export const get = handle((req, res) => {
  const c = db.companies.get(req.params.id)
  if (!c) throw httpError(404, 'ไม่พบสถานประกอบการ')
  const staff = db.users.find((u) => u.role === 'employer' && u.companyId === c.id).map(toPublic)
  res.json({ ...withCounts(c), staff })
})

export const create = handle((req, res) => {
  const data = checkScope(pick(req.body, FIELDS))
  if (!data.name?.trim()) throw httpError(400, 'กรุณากรอกชื่อสถานประกอบการ')
  const c = db.companies.insert({ address: '', phone: '', email: '', contactName: '', website: '', description: '', category: '', ...data, verified: true })
  audit(req.user, `เพิ่มสถานประกอบการ ${c.name}`)
  res.status(201).json(c)
})

// กองสหกิจ/Admin แก้ได้ทุกแห่ง, สถานประกอบการแก้ได้เฉพาะของตัวเอง
export const update = handle((req, res) => {
  const c = db.companies.get(req.params.id)
  if (!c) throw httpError(404, 'ไม่พบสถานประกอบการ')
  if (!isStaff(req.user) && !(req.user.role === 'employer' && req.user.companyId === c.id)) {
    throw httpError(403, 'ไม่มีสิทธิ์แก้ไขสถานประกอบการนี้')
  }
  const data = checkScope(pick(req.body, FIELDS), c)
  if (data.name !== undefined && !data.name.trim()) throw httpError(400, 'กรุณากรอกชื่อสถานประกอบการ')
  const updated = db.companies.update(c.id, data)
  audit(req.user, `แก้ไขข้อมูลสถานประกอบการ ${updated.name}`)
  res.json(updated)
})

export const verify = handle((req, res) => {
  const c = db.companies.get(req.params.id)
  if (!c) throw httpError(404, 'ไม่พบสถานประกอบการ')
  const verified = !!req.body?.verified
  const updated = db.companies.update(c.id, { verified })
  audit(req.user, `${verified ? 'รับรอง' : 'ยกเลิกการรับรอง'}สถานประกอบการ ${c.name}`)
  res.json(updated)
})

export const remove = handle((req, res) => {
  const c = db.companies.get(req.params.id)
  if (!c) throw httpError(404, 'ไม่พบสถานประกอบการ')
  if (db.placements.count((p) => p.companyId === c.id)) throw httpError(400, 'มีนักศึกษาผูกกับสถานประกอบการนี้อยู่ ลบไม่ได้')
  db.companies.remove(c.id)
  audit(req.user, `ลบสถานประกอบการ ${c.name}`)
  res.json({ ok: true })
})
