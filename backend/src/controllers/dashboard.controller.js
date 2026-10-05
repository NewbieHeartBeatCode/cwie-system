import { db } from '../config/db.js'
import { isStaff } from '../config/roles.js'
import { visiblePlacements, visibleStudentIds } from '../services/scope.service.js'
import { expand, OPEN_STATUS } from '../services/placement.service.js'
import { visibleAnnouncements } from './announcement.controller.js'

const countBy = (rows, key) => rows.reduce((m, r) => ({ ...m, [r[key]]: (m[r[key]] || 0) + 1 }), {})

// งานที่รอให้ผู้ใช้แต่ละ role ทำ — แต่ละข้อมีลิงก์ไปหน้าที่เกี่ยวข้อง
function todos(user, placements, docs) {
  const n = (status) => placements.filter((p) => p.status === status).length
  const docsWaiting = docs.filter((d) => d.status === 'submitted').length
  const list = []
  const add = (label, count, to) => count > 0 && list.push({ label, count, to })

  switch (user.role) {
    case 'admin':
    case 'office':
      add('ใบสมัครรอกองสหกิจอนุมัติ', n('pending_office'), '/placements?status=pending_office')
      add('เอกสารรอตรวจสอบ/อนุมัติ', docs.filter((d) => ['submitted', 'certified'].includes(d.status)).length, '/documents')
      add('สถานประกอบการรอการตรวจสอบ', db.companies.count((c) => !c.verified), '/companies')
      break
    case 'counselor':
      add('ใบสมัครรออาจารย์ที่ปรึกษารับรอง', n('pending_counselor'), '/placements?status=pending_counselor')
      add('เอกสารรอตรวจสอบ', docsWaiting, '/documents?status=submitted')
      break
    case 'employer':
      add('นักศึกษารอยืนยันการรับเข้าปฏิบัติงาน', n('pending_company'), '/placements?status=pending_company')
      add('เอกสารรอตรวจสอบ/รับรอง', docsWaiting, '/documents?status=submitted')
      add('นักศึกษาที่ยังไม่ได้ประเมิน', placements.filter((p) => ['active', 'completed'].includes(p.status) &&
        !db.evaluations.findOne((e) => e.placementId === p.id && e.evaluatorRole === 'employer')).length, '/placements?status=active')
      break
    case 'advisor':
      add('นักศึกษาที่ยังนิเทศไม่ครบ 2 ครั้ง', placements.filter((p) => p.status === 'active' &&
        db.supervisions.count((s) => s.placementId === p.id) < 2).length, '/placements?status=active')
      add('นักศึกษาที่ยังไม่ได้ประเมิน', placements.filter((p) => ['active', 'completed'].includes(p.status) &&
        !db.evaluations.findOne((e) => e.placementId === p.id && e.evaluatorRole === 'advisor')).length, '/placements?status=active')
      add('เอกสารรอตรวจสอบ', docsWaiting, '/documents?status=submitted')
      break
    case 'student':
      add('เอกสารถูกตีกลับ ต้องแก้ไข', docs.filter((d) => d.status === 'returned').length, '/documents?status=returned')
      if (!placements.some((p) => OPEN_STATUS.includes(p.status) || p.status === 'completed')) list.push({ label: 'ยังไม่ได้ยื่นสมัครเข้าร่วม CWIE', count: 1, to: '/my-cwie' })
      break
  }
  return list
}

export function summary(req, res) {
  const user = req.user
  const placements = visiblePlacements(user)
  const studentIds = visibleStudentIds(user)
  const docs = db.documents.find((d) => studentIds === null || studentIds.has(d.studentId))
  const pIds = new Set(placements.map((p) => p.id))

  res.json({
    placements: { total: placements.length, byStatus: countBy(placements, 'status') },
    documents: { total: docs.length, byStatus: countBy(docs, 'status') },
    supervisions: db.supervisions.count((s) => pIds.has(s.placementId)),
    evaluations: db.evaluations.count((e) => pIds.has(e.placementId)),
    students: studentIds === null ? db.users.count((u) => u.role === 'student') : [...studentIds].filter((id) => id !== user.id).length,
    companies: isStaff(user) ? { total: db.companies.all().length, unverified: db.companies.count((c) => !c.verified) } : null,
    users: user.role === 'admin' ? countBy(db.users.all(), 'role') : null,
    todos: todos(user, placements, docs),
    recent: expand(placements.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)).slice(0, 5)),
    announcements: visibleAnnouncements(user).slice(0, 4),
  })
}
