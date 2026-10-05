import { db } from '../config/db.js'
import { visiblePlacements } from '../services/scope.service.js'
import { expand } from '../services/placement.service.js'

const avg = (nums) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null)

// รายงานและสถิติ — ขอบเขตตามสิทธิ์ (กองสหกิจ/Admin เห็นทั้งหมด, อาจารย์เห็นนักศึกษาที่รับผิดชอบ)
export function report(req, res) {
  const placements = expand(visiblePlacements(req.user).filter((p) => p.status !== 'rejected'))
  const evals = db.evaluations.all()
  const sups = db.supervisions.all()
  const docs = db.documents.all()

  const rows = placements.map((p) => {
    const score = (role) => evals.find((e) => e.placementId === p.id && e.evaluatorRole === role)?.total ?? null
    const myDocs = docs.filter((d) => d.studentId === p.studentId)
    return {
      id: p.id,
      studentName: p.student?.fullName, studentCode: p.student?.studentId, program: p.student?.program,
      companyName: p.company?.name, advisorName: p.advisor?.fullName || null,
      position: p.position, startDate: p.startDate, endDate: p.endDate, status: p.status,
      supervisions: sups.filter((s) => s.placementId === p.id).length,
      employerScore: score('employer'), advisorScore: score('advisor'),
      docsApproved: myDocs.filter((d) => d.status === 'approved').length, docsTotal: myDocs.length,
    }
  })

  const byCompany = {}
  for (const r of rows) byCompany[r.companyName] = (byCompany[r.companyName] || 0) + 1

  res.json({
    rows,
    summary: {
      total: rows.length,
      byStatus: rows.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] || 0) + 1 }), {}),
      byCompany: Object.entries(byCompany).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      // คะแนนเฉลี่ยคิดจากนักศึกษาที่ได้รับการประเมินแล้วเท่านั้น (บอกจำนวนคนไว้ด้วย)
      avgEmployerScore: avg(rows.map((r) => r.employerScore).filter((v) => v !== null)),
      employerScoreCount: rows.filter((r) => r.employerScore !== null).length,
      avgAdvisorScore: avg(rows.map((r) => r.advisorScore).filter((v) => v !== null)),
      advisorScoreCount: rows.filter((r) => r.advisorScore !== null).length,
      supervisionDone: rows.filter((r) => r.supervisions >= 2).length,
    },
  })
}
