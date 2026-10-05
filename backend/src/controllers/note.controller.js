import { placementFor } from '../services/scope.service.js'
import { db } from '../config/db.js'
import { audit } from '../services/audit.service.js'
import { handle, httpError } from '../utils/http.js'

// บันทึกข้อความผูกกับการออกฝึก ใช้ร่วมกันระหว่าง
//   บันทึกกิจกรรม/การปฏิบัติงาน (activities) และ ข้อเสนอแนะจากอาจารย์ที่ปรึกษา (advices)
// (การอ่านข้อมูลมาพร้อมหน้ารายละเอียดการออกฝึก GET /placements/:id)
export function createNote(collection, { writers, label, activeOnly }) {
  return handle((req, res) => {
    if (!writers.includes(req.user.role)) throw httpError(403, 'ไม่มีสิทธิ์บันทึก')
    const b = req.body || {}
    const p = placementFor(req.user, b.placementId)
    if (activeOnly && !['active', 'completed'].includes(p.status)) throw httpError(400, 'นักศึกษายังไม่ได้เริ่มปฏิบัติงาน')
    if (!b.date || !b.detail?.trim()) throw httpError(400, 'กรุณากรอกวันที่และรายละเอียด')
    const row = collection.insert({
      placementId: p.id, studentId: p.studentId, authorId: req.user.id, authorRole: req.user.role,
      date: b.date, title: (b.title || '').trim(), detail: b.detail.trim(),
    })
    audit(req.user, `${label}: ${db.users.get(p.studentId)?.fullName}`)
    res.status(201).json(row)
  })
}
