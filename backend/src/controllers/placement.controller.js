import { db } from '../config/db.js'
import { isStaff } from '../config/roles.js'
import { visiblePlacements, placementFor } from '../services/scope.service.js'
import { applyAction, expand, historyEntry, OPEN_STATUS } from '../services/placement.service.js'
import { byId } from '../services/user.service.js'
import { audit } from '../services/audit.service.js'
import { handle, httpError, pick } from '../utils/http.js'

const newest = (a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)

export const list = handle((req, res) => {
  let rows = visiblePlacements(req.user)
  if (req.query.status) rows = rows.filter((p) => p.status === req.query.status)
  res.json(expand(rows.sort(newest)))
})

// ข้อมูลครบทุกอย่างของการออกฝึก 1 รายการ (หน้ารายละเอียดใช้ตัวนี้ตัวเดียว)
export const detail = handle((req, res) => {
  const p = placementFor(req.user, req.params.id)
  const users = byId(db.users.all())
  const author = (r, key) => ({ ...r, authorName: users.get(r[key])?.fullName || '-' })
  const byPlacement = (c) => c.find((r) => r.placementId === p.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  res.json({
    placement: expand([p])[0],
    documents: db.documents.find((d) => d.studentId === p.studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    activities: byPlacement(db.activities).map((r) => author(r, 'authorId')),
    supervisions: byPlacement(db.supervisions).sort((a, b) => a.round - b.round).map((r) => author(r, 'advisorId')),
    evaluations: byPlacement(db.evaluations).map((r) => author(r, 'evaluatorId')),
    advices: byPlacement(db.advices).map((r) => author(r, 'authorId')),
  })
})

// นักศึกษายื่นสมัครเอง หรือ กองสหกิจจับคู่ให้โดยตรง
export const create = handle((req, res) => {
  const b = req.body || {}
  const staff = isStaff(req.user)
  if (!staff && req.user.role !== 'student') throw httpError(403, 'ไม่มีสิทธิ์')

  const student = db.users.get(staff ? b.studentId : req.user.id)
  if (!student || student.role !== 'student') throw httpError(400, 'กรุณาเลือกนักศึกษา')
  if (db.placements.count((p) => p.studentId === student.id && OPEN_STATUS.includes(p.status))) {
    throw httpError(400, 'นักศึกษามีรายการออกฝึกที่ยังดำเนินการอยู่แล้ว')
  }
  const company = db.companies.get(b.companyId)
  if (!company) throw httpError(400, 'กรุณาเลือกสถานประกอบการ')
  if (!company.verified && !staff) throw httpError(400, 'สถานประกอบการนี้ยังไม่ผ่านการตรวจสอบ')
  if (!b.position?.trim() || !b.startDate || !b.endDate) throw httpError(400, 'กรุณากรอกตำแหน่งและช่วงเวลาปฏิบัติงาน')
  if (b.endDate < b.startDate) throw httpError(400, 'วันสิ้นสุดต้องอยู่หลังวันเริ่ม')

  const status = staff ? 'pending_company' : student.counselorId ? 'pending_counselor' : 'pending_office'
  const p = db.placements.insert({
    studentId: student.id,
    companyId: company.id,
    advisorId: staff ? b.advisorId || null : null,
    counselorId: student.counselorId || null,
    position: b.position.trim(),
    startDate: b.startDate,
    endDate: b.endDate,
    note: b.note || '',
    status,
    history: [historyEntry(req.user, staff ? 'กองสหกิจจับคู่นักศึกษากับสถานประกอบการ' : 'ยื่นสมัครเข้าร่วม CWIE', b.note || '')],
  })
  audit(req.user, `${staff ? 'จับคู่' : 'ยื่นสมัคร'} CWIE: ${student.fullName} กับ ${company.name}`)
  res.status(201).json(expand([p])[0])
})

// กองสหกิจ/Admin แก้ไขข้อมูลการออกฝึก มอบหมายอาจารย์
export const update = handle((req, res) => {
  const p = placementFor(req.user, req.params.id)
  const patch = pick(req.body, ['companyId', 'position', 'startDate', 'endDate', 'advisorId', 'counselorId', 'note'])
  if (patch.advisorId && db.users.get(patch.advisorId)?.role !== 'advisor') throw httpError(400, 'อาจารย์นิเทศไม่ถูกต้อง')
  if (patch.counselorId && db.users.get(patch.counselorId)?.role !== 'counselor') throw httpError(400, 'อาจารย์ที่ปรึกษาไม่ถูกต้อง')
  if (patch.companyId && !db.companies.get(patch.companyId)) throw httpError(400, 'สถานประกอบการไม่ถูกต้อง')
  const updated = db.placements.update(p.id, {
    ...patch,
    history: [...(p.history || []), historyEntry(req.user, 'แก้ไขข้อมูล / มอบหมายอาจารย์')],
  })
  audit(req.user, 'แก้ไขข้อมูลการออกฝึก / มอบหมายอาจารย์')
  res.json(expand([updated])[0])
})

// เดินขั้นตอน: รับรอง / อนุมัติ / ยืนยันรับ / เสร็จสิ้น / ตีกลับ
export const action = handle((req, res) => {
  let p = placementFor(req.user, req.params.id)
  const { action, note = '', advisorId } = req.body || {}
  if (action === 'approve' && advisorId && isStaff(req.user)) {
    if (db.users.get(advisorId)?.role !== 'advisor') throw httpError(400, 'อาจารย์นิเทศไม่ถูกต้อง')
    p = db.placements.update(p.id, { advisorId })
  }
  if (action === 'confirm' && req.user.role === 'employer' && p.companyId !== req.user.companyId) throw httpError(403, 'ไม่มีสิทธิ์')
  const updated = applyAction(p, req.user, action, note)
  const student = db.users.get(p.studentId)
  audit(req.user, `${updated.history.at(-1).action}: ${student?.fullName}`)
  res.json(expand([updated])[0])
})
