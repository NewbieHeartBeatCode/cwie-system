import { db } from '../config/db.js'
import { audit } from '../services/audit.service.js'
import { fileInfo, downloadFile, removeFile } from '../middleware/upload.js'
import { STAGES } from './document.controller.js'
import { handle, httpError } from '../utils/http.js'

// แบบฟอร์มให้ทุกคนดาวน์โหลด — กองสหกิจ/Admin เป็นคนอัปโหลด
export const list = (req, res) => res.json(db.forms.all().sort((a, b) => a.title.localeCompare(b.title, 'th')))

export const create = handle((req, res) => {
  if (!req.file) throw httpError(400, 'กรุณาเลือกไฟล์')
  const { title = '', stage, description = '' } = req.body
  if (!title.trim() || !STAGES.includes(stage)) {
    removeFile(req.file.filename)
    throw httpError(400, 'กรุณากรอกชื่อแบบฟอร์มและเลือกช่วง')
  }
  const form = db.forms.insert({ title: title.trim(), stage, description, ...fileInfo(req.file) })
  audit(req.user, `เพิ่มแบบฟอร์ม "${form.title}"`)
  res.status(201).json(form)
})

export const download = handle(async (req, res) => {
  const f = db.forms.get(req.params.id)
  if (!f) throw httpError(404, 'ไม่พบแบบฟอร์ม')
  await downloadFile(res, f.storedName, f.fileName)
})

export const remove = handle((req, res) => {
  const f = db.forms.get(req.params.id)
  if (!f) throw httpError(404, 'ไม่พบแบบฟอร์ม')
  removeFile(f.storedName)
  db.forms.remove(f.id)
  audit(req.user, `ลบแบบฟอร์ม "${f.title}"`)
  res.json({ ok: true })
})
