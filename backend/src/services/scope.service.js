import { db } from '../config/db.js'
import { isStaff } from '../config/roles.js'
import { httpError } from '../utils/http.js'

// กำหนดว่าผู้ใช้แต่ละ role เห็นข้อมูลของใครได้บ้าง — ทุก endpoint กรองผ่านไฟล์นี้

// การออกฝึกที่ผู้ใช้มองเห็น
export function visiblePlacements(user) {
  const all = db.placements.all()
  switch (user.role) {
    case 'admin':
    case 'office':    return all
    case 'student':   return all.filter((p) => p.studentId === user.id)
    case 'advisor':   return all.filter((p) => p.advisorId === user.id)
    case 'counselor': return all.filter((p) => p.counselorId === user.id)
    case 'employer':  return all.filter((p) => p.companyId && p.companyId === user.companyId)
    default:          return []
  }
}

// รหัสนักศึกษาที่มองเห็น (null = เห็นทั้งหมด)
export function visibleStudentIds(user) {
  if (isStaff(user)) return null
  const ids = new Set(visiblePlacements(user).map((p) => p.studentId))
  if (user.role === 'student') ids.add(user.id)
  // อาจารย์ที่ปรึกษาเห็นนักศึกษาในความดูแลตั้งแต่ยังไม่ออกฝึก
  if (user.role === 'counselor') db.users.find((u) => u.counselorId === user.id).forEach((u) => ids.add(u.id))
  return ids
}

export function canSeeStudent(user, studentId) {
  const ids = visibleStudentIds(user)
  return ids === null || ids.has(studentId)
}

export function placementFor(user, id) {
  const p = visiblePlacements(user).find((x) => x.id === id)
  if (!p) throw httpError(404, 'ไม่พบข้อมูลการออกฝึก หรือไม่มีสิทธิ์เข้าถึง')
  return p
}
