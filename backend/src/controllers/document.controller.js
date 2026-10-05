import { db } from '../config/db.js'
import { isStaff } from '../config/roles.js'
import { canSeeStudent, visibleStudentIds } from '../services/scope.service.js'
import { historyEntry, OPEN_STATUS } from '../services/placement.service.js'
import { byId } from '../services/user.service.js'
import { audit } from '../services/audit.service.js'
import { fileInfo, downloadFile, removeFile } from '../middleware/upload.js'
import { handle, httpError } from '../utils/http.js'

// ขั้นตอนเอกสาร: อัปโหลด(submitted) -> ตรวจสอบ/รับรอง(certified) -> อนุมัติ(approved)
//                               \-> ตีกลับ(returned) -> นักศึกษาแก้ไขส่งใหม่(submitted)
export const STAGES = ['before', 'during', 'after']
const REVIEWERS = ['advisor', 'counselor', 'employer']

function getVisible(user, id) {
  const d = db.documents.get(id)
  if (!d || !canSeeStudent(user, d.studentId)) throw httpError(404, 'ไม่พบเอกสาร หรือไม่มีสิทธิ์เข้าถึง')
  return d
}

const withStudent = (rows) => {
  const users = byId(db.users.all())
  return rows.map((d) => {
    const s = users.get(d.studentId)
    return { ...d, studentName: s?.fullName || '-', studentCode: s?.studentId || '' }
  })
}

export const list = handle((req, res) => {
  const ids = visibleStudentIds(req.user)
  let rows = db.documents.find((d) => ids === null || ids.has(d.studentId))
  for (const key of ['stage', 'status', 'studentId']) {
    if (req.query[key]) rows = rows.filter((d) => d[key] === req.query[key])
  }
  res.json(withStudent(rows.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))))
})

export const create = handle((req, res) => {
  if (req.user.role !== 'student') throw httpError(403, 'เฉพาะนักศึกษาที่ส่งเอกสารได้')
  if (!req.file) throw httpError(400, 'กรุณาเลือกไฟล์')
  const { title = '', stage } = req.body
  if (!title.trim() || !STAGES.includes(stage)) {
    removeFile(req.file.filename)
    throw httpError(400, 'กรุณากรอกชื่อเอกสารและเลือกช่วงของเอกสาร')
  }
  const placement = db.placements.findOne((p) => p.studentId === req.user.id && OPEN_STATUS.includes(p.status))
  const doc = db.documents.insert({
    studentId: req.user.id,
    placementId: placement?.id || null,
    title: title.trim(),
    stage,
    ...fileInfo(req.file),
    status: 'submitted',
    history: [historyEntry(req.user, 'อัปโหลดเอกสาร')],
  })
  audit(req.user, `ส่งเอกสาร "${doc.title}"`)
  res.status(201).json(doc)
})

// นักศึกษาส่งฉบับแก้ไข (หลังถูกตีกลับ หรือก่อนมีคนตรวจ)
export const resubmit = handle((req, res) => {
  const d = getVisible(req.user, req.params.id)
  if (req.user.id !== d.studentId) throw httpError(403, 'แก้ไขได้เฉพาะเอกสารของตัวเอง')
  if (!['returned', 'submitted'].includes(d.status)) throw httpError(400, 'เอกสารนี้อยู่ระหว่างอนุมัติหรืออนุมัติแล้ว แก้ไขไม่ได้')
  if (!req.file) throw httpError(400, 'กรุณาเลือกไฟล์')
  removeFile(d.storedName)
  const updated = db.documents.update(d.id, {
    ...fileInfo(req.file),
    status: 'submitted',
    history: [...d.history, historyEntry(req.user, 'ส่งเอกสารฉบับแก้ไข', req.body.note || '')],
  })
  audit(req.user, `ส่งเอกสารฉบับแก้ไข "${d.title}"`)
  res.json(updated)
})

// ตรวจสอบเอกสาร: certify (อาจารย์/สถานประกอบการรับรอง), approve (กองสหกิจ/Admin), return (ตีกลับ)
export const review = handle((req, res) => {
  const d = getVisible(req.user, req.params.id)
  const { action, note = '' } = req.body || {}
  const staff = isStaff(req.user)
  const rules = {
    certify: { ok: REVIEWERS.includes(req.user.role), from: ['submitted'], to: 'certified', label: 'ตรวจสอบและรับรองเอกสาร' },
    approve: { ok: staff, from: ['submitted', 'certified'], to: 'approved', label: 'อนุมัติเอกสาร' },
    return:  { ok: staff || REVIEWERS.includes(req.user.role), from: ['submitted', 'certified'], to: 'returned', label: 'ตีกลับให้แก้ไข' },
  }
  const r = rules[action]
  if (!r) throw httpError(400, 'ไม่รู้จักคำสั่งนี้')
  if (!r.ok) throw httpError(403, 'ไม่มีสิทธิ์ทำขั้นตอนนี้')
  if (!r.from.includes(d.status)) throw httpError(400, 'สถานะเอกสารปัจจุบันทำขั้นตอนนี้ไม่ได้')
  if (action === 'return' && !note.trim()) throw httpError(400, 'กรุณาระบุสิ่งที่ต้องแก้ไข')

  const updated = db.documents.update(d.id, { status: r.to, history: [...d.history, historyEntry(req.user, r.label, note)] })
  audit(req.user, `${r.label} "${d.title}"`)
  res.json(updated)
})

export const download = handle(async (req, res) => {
  const d = getVisible(req.user, req.params.id)
  await downloadFile(res, d.storedName, d.fileName)
})

export const remove = handle((req, res) => {
  const d = getVisible(req.user, req.params.id)
  const own = req.user.id === d.studentId && d.status !== 'approved'
  if (!own && req.user.role !== 'admin') throw httpError(403, 'ลบเอกสารนี้ไม่ได้')
  removeFile(d.storedName)
  db.documents.remove(d.id)
  audit(req.user, `ลบเอกสาร "${d.title}"`)
  res.json({ ok: true })
})
