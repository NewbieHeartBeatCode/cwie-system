import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'
import { env } from '../config/env.js'
import { getGridFS } from '../config/db.js'

fs.mkdirSync(env.uploadDir, { recursive: true })

const ALLOWED = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.zip']

function fixName(name) {
  if ([...name].some((c) => c.charCodeAt(0) > 0xff)) return name
  const utf8 = Buffer.from(name, "latin1").toString("utf8")
  return Buffer.from(utf8, "utf8").toString("latin1") === name ? utf8 : name
}

const _upload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.originalname = fixName(file.originalname)
    const ok = ALLOWED.includes(path.extname(file.originalname).toLowerCase())
    cb(ok ? null : Object.assign(new Error('ชนิดไฟล์ไม่รองรับ (รองรับ ' + ALLOWED.join(' ') + ')'), { status: 400 }), ok)
  },
})

export const upload = {
  single: (field) => {
    const mw = _upload.single(field)
    return (req, res, next) => {
      mw(req, res, async (err) => {
        if (err) return next(err)
        if (req.file && env.mongodbUri) {
          try {
            const bucket = await getGridFS()
            if (bucket) {
               const stream = bucket.openUploadStream(req.file.filename)
               const readStream = fs.createReadStream(req.file.path)
               await new Promise((resolve, reject) => {
                 readStream.pipe(stream).on('error', reject).on('finish', resolve)
               })
               fs.rmSync(req.file.path, { force: true })
            }
          } catch(e) {
             return next(e)
          }
        }
        next()
      })
    }
  }
}

export const fileInfo = (file) => ({ fileName: file.originalname, storedName: file.filename, size: file.size })

export const filePath = (storedName) => path.join(env.uploadDir, storedName)

export async function removeFile(storedName) {
  if (!storedName) return
  if (env.mongodbUri) {
    const bucket = await getGridFS()
    if (bucket) {
       const files = await bucket.find({ filename: storedName }).toArray()
       for (const f of files) {
         await bucket.delete(f._id)
       }
    }
  }
  const p = filePath(storedName)
  if (fs.existsSync(p)) {
    fs.rmSync(p, { force: true })
  }
}

export async function downloadFile(res, storedName, fileName) {
  const p = filePath(storedName)
  if (fs.existsSync(p)) {
    return res.download(p, fileName)
  }
  if (env.mongodbUri) {
    const bucket = await getGridFS()
    if (bucket) {
      const files = await bucket.find({ filename: storedName }).toArray()
      if (files.length > 0) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
        return bucket.openDownloadStreamByName(storedName).pipe(res)
      }
    }
  }
  res.status(404).send('File not found')
}
