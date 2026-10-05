import { db } from '../config/db.js'

// บันทึกทุกการกระทำสำคัญ ไว้ให้ Admin ตรวจสอบย้อนหลัง
export function audit(user, action) {
  db.auditLogs.insert({ actorId: user?.id || null, actorName: user?.fullName || 'ระบบ', role: user?.role || null, action })
}
