import { db } from '../config/db.js'
import { placementFor } from '../services/scope.service.js'
import { audit } from '../services/audit.service.js'
import { handle, httpError } from '../utils/http.js'

const MAX_ROUNDS = 2

// อาจารย์นิเทศบันทึกผลการนิเทศ (สูงสุด 2 ครั้งต่อการออกฝึก)
export const create = handle((req, res) => {
  const b = req.body || {}
  const p = placementFor(req.user, b.placementId)
  if (!['active', 'completed'].includes(p.status)) throw httpError(400, 'นักศึกษายังไม่ได้เริ่มปฏิบัติงาน')
  const done = db.supervisions.count((s) => s.placementId === p.id)
  if (done >= MAX_ROUNDS) throw httpError(400, `นิเทศครบ ${MAX_ROUNDS} ครั้งแล้ว`)
  if (!b.date || (b.result || '').trim().length < 5) throw httpError(400, 'กรุณากรอกวันที่และผลการนิเทศ (อย่างน้อย 5 ตัวอักษร)')

  const rec = db.supervisions.insert({
    placementId: p.id, studentId: p.studentId, advisorId: req.user.id,
    round: done + 1, date: b.date, channel: b.channel || 'เข้าพบ ณ สถานประกอบการ',
    result: b.result.trim(), suggestion: (b.suggestion || '').trim(),
  })
  audit(req.user, `บันทึกการนิเทศครั้งที่ ${rec.round}: ${db.users.get(p.studentId)?.fullName}`)
  res.status(201).json(rec)
})
