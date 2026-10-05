import { db } from '../config/db.js'
import { brief, byId } from './user.service.js'
import { httpError } from '../utils/http.js'

// ขั้นตอนการออกฝึก:
// pending_counselor -> pending_office -> pending_company -> active -> completed  (ตีกลับได้ = rejected)
export const OPEN_STATUS = ['pending_counselor', 'pending_office', 'pending_company', 'active']

// action -> [role ที่ทำได้, สถานะก่อน, สถานะหลัง]
const ACTIONS = {
  endorse:  { roles: ['counselor', 'office', 'admin'], from: ['pending_counselor'], to: 'pending_office', label: 'อาจารย์ที่ปรึกษารับรอง' },
  approve:  { roles: ['office', 'admin'], from: ['pending_counselor', 'pending_office'], to: 'pending_company', label: 'กองสหกิจอนุมัติ' },
  confirm:  { roles: ['employer', 'office', 'admin'], from: ['pending_company'], to: 'active', label: 'สถานประกอบการยืนยันรับนักศึกษา' },
  complete: { roles: ['advisor', 'office', 'admin'], from: ['active'], to: 'completed', label: 'ปฏิบัติงานเสร็จสิ้น' },
  reject:   { roles: ['counselor', 'office', 'admin', 'employer'], from: ['pending_counselor', 'pending_office', 'pending_company'], to: 'rejected', label: 'ตีกลับ / ไม่อนุมัติ' },
}

export function applyAction(placement, user, action, note = '') {
  const a = ACTIONS[action]
  if (!a) throw httpError(400, 'ไม่รู้จักคำสั่งนี้')
  if (!a.roles.includes(user.role)) throw httpError(403, 'ไม่มีสิทธิ์ทำขั้นตอนนี้')
  if (!a.from.includes(placement.status)) throw httpError(400, 'สถานะปัจจุบันทำขั้นตอนนี้ไม่ได้')
  if (action === 'reject' && !note.trim()) throw httpError(400, 'กรุณาระบุเหตุผลที่ตีกลับ')
  if (action === 'approve' && !placement.advisorId) throw httpError(400, 'กรุณามอบหมายอาจารย์นิเทศก่อนอนุมัติ')
  return db.placements.update(placement.id, {
    status: a.to,
    history: [...(placement.history || []), historyEntry(user, a.label, note)],
  })
}

export const historyEntry = (user, action, note = '') =>
  ({ at: new Date().toISOString(), byId: user.id, byName: user.fullName, role: user.role, action, note })

// แนบชื่อนักศึกษา / อาจารย์ / สถานประกอบการ ให้หน้าเว็บใช้ได้เลย
export function expand(list) {
  const users = byId(db.users.all())
  const companies = byId(db.companies.all())
  return list.map((p) => {
    const c = companies.get(p.companyId)
    return {
      ...p,
      student: brief(users.get(p.studentId)),
      advisor: brief(users.get(p.advisorId)) || null,
      counselor: brief(users.get(p.counselorId)) || null,
      company: c ? { id: c.id, name: c.name, address: c.address, phone: c.phone, contactName: c.contactName } : null,
    }
  })
}
