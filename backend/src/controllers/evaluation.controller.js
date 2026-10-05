import { db } from '../config/db.js'
import { RUBRICS, gradeOf } from '../config/rubrics.js'
import { placementFor } from '../services/scope.service.js'
import { audit } from '../services/audit.service.js'
import { handle, httpError } from '../utils/http.js'

export const rubrics = (req, res) => res.json(RUBRICS)

// สถานประกอบการ และ อาจารย์นิเทศ ประเมินได้ฝ่ายละ 1 ครั้งต่อการออกฝึก
export const create = handle((req, res) => {
  const role = req.user.role
  const rubric = RUBRICS[role]
  if (!rubric) throw httpError(403, 'ไม่มีสิทธิ์ประเมิน')
  const b = req.body || {}
  const p = placementFor(req.user, b.placementId)
  if (!['active', 'completed'].includes(p.status)) throw httpError(400, 'นักศึกษายังไม่ได้เริ่มปฏิบัติงาน')
  if (db.evaluations.findOne((e) => e.placementId === p.id && e.evaluatorRole === role)) throw httpError(400, 'ประเมินนักศึกษาคนนี้ไปแล้ว')

  const scores = rubric.map((r) => {
    const score = Number(b.scores?.[r.key])
    if (!Number.isFinite(score) || score < 0 || score > 100) throw httpError(400, `คะแนน "${r.label}" ต้องอยู่ระหว่าง 0-100`)
    return { key: r.key, label: r.label, weight: r.weight, score }
  })
  const total = Math.round(scores.reduce((sum, s) => sum + (s.score / 100) * s.weight, 0) * 10) / 10

  const ev = db.evaluations.insert({
    placementId: p.id, studentId: p.studentId, evaluatorId: req.user.id, evaluatorRole: role,
    scores, total, grade: gradeOf(total), comment: (b.comment || '').trim(),
  })
  audit(req.user, `ประเมินนักศึกษา ${db.users.get(p.studentId)?.fullName} ได้ ${total}/100`)
  res.status(201).json(ev)
})
