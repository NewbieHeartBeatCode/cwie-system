import { Router } from 'express'
import { db } from '../config/db.js'
import { env } from '../config/env.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { createNote } from '../controllers/note.controller.js'
import * as auth from '../controllers/auth.controller.js'
import * as users from '../controllers/user.controller.js'
import * as companies from '../controllers/company.controller.js'
import * as placements from '../controllers/placement.controller.js'
import * as documents from '../controllers/document.controller.js'
import * as forms from '../controllers/form.controller.js'
import * as announcements from '../controllers/announcement.controller.js'
import * as supervisions from '../controllers/supervision.controller.js'
import * as evaluations from '../controllers/evaluation.controller.js'
import * as messages from '../controllers/message.controller.js'
import * as dashboard from '../controllers/dashboard.controller.js'
import * as reports from '../controllers/report.controller.js'
import * as auditLog from '../controllers/audit.controller.js'

// สิทธิ์ของแต่ละ endpoint ดูได้จากไฟล์นี้ไฟล์เดียว
// ขอบเขตข้อมูล (เห็นของใคร) กรองต่ออีกชั้นใน services/scope.service.js
const STAFF = ['admin', 'office']
// ข้อมูลการนิเทศ/ประเมิน/บันทึกกิจกรรม/ข้อเสนอแนะ อ่านผ่าน GET /placements/:id ทีเดียว

const r = Router()
r.get('/health', (req, res) => res.json({ ok: true }))

r.post('/auth/register', auth.register)
r.post('/auth/login', auth.login)

// ช่วงพัฒนา: เปิดดูข้อมูลแต่ละตารางเป็น JSON ในเบราว์เซอร์ได้ เช่น /api/dev/data/users
if (!env.isProd) {
  r.get('/dev/data/:name', (req, res) => {
    const c = db[req.params.name]
    if (!c) return res.status(404).json({ message: 'ไม่มีตารางนี้', tables: Object.keys(db) })
    res.json(c.all().map(({ passwordHash, ...row }) => row))
  })
}

r.use(requireAuth) // ทุกอย่างด้านล่างต้อง login

r.get('/auth/me', auth.me)
r.put('/auth/me', auth.updateMe)

r.get('/dashboard', dashboard.summary)

r.get('/users', requireRole('admin', 'office', 'advisor', 'counselor', 'employer'), users.list)
r.post('/users', requireRole(...STAFF), users.create)
r.put('/users/:id', requireRole(...STAFF), users.update)
r.delete('/users/:id', requireRole('admin'), users.remove)

r.get('/companies', companies.list)
r.get('/companies/:id', companies.get)
r.post('/companies', requireRole(...STAFF), companies.create)
r.put('/companies/:id', requireRole(...STAFF, 'employer'), companies.update)
r.put('/companies/:id/verify', requireRole(...STAFF), companies.verify)
r.delete('/companies/:id', requireRole('admin'), companies.remove)

r.get('/placements', placements.list)
r.get('/placements/:id', placements.detail)
r.post('/placements', requireRole('student', ...STAFF), placements.create)
r.put('/placements/:id', requireRole(...STAFF), placements.update)
r.put('/placements/:id/action', placements.action)

r.get('/documents', documents.list)
r.post('/documents', requireRole('student'), upload.single('file'), documents.create)
r.put('/documents/:id/file', requireRole('student'), upload.single('file'), documents.resubmit)
r.put('/documents/:id/review', requireRole(...STAFF, 'advisor', 'counselor', 'employer'), documents.review)
r.get('/documents/:id/file', documents.download)
r.delete('/documents/:id', documents.remove)

r.get('/forms', forms.list)
r.get('/forms/:id/file', forms.download)
r.post('/forms', requireRole(...STAFF), upload.single('file'), forms.create)
r.delete('/forms/:id', requireRole(...STAFF), forms.remove)

r.get('/announcements', announcements.list)
r.post('/announcements', requireRole(...STAFF, 'employer'), announcements.create)
r.put('/announcements/:id', requireRole(...STAFF, 'employer'), announcements.update)
r.delete('/announcements/:id', requireRole(...STAFF, 'employer'), announcements.remove)

r.post('/activities', createNote(db.activities, { writers: ['employer', 'advisor', ...STAFF], label: 'บันทึกกิจกรรม', activeOnly: true }))

r.post('/advices', createNote(db.advices, { writers: ['counselor', 'admin'], label: 'บันทึกข้อเสนอแนะ' }))

r.post('/supervisions', requireRole('advisor', 'admin'), supervisions.create)

r.get('/evaluations/rubrics', evaluations.rubrics)
r.post('/evaluations', requireRole('employer', 'advisor'), evaluations.create)

r.get('/messages/threads', requireRole(...STAFF), messages.threads)
r.get('/messages', requireRole(...STAFF, 'employer'), messages.list)
r.post('/messages', requireRole(...STAFF, 'employer'), messages.create)

r.get('/reports', requireRole(...STAFF, 'advisor', 'counselor'), reports.report)

r.get('/audit', requireRole('admin'), auditLog.list)

export default r
