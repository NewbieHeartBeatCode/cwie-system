import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
dotenv.config()

const here = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || (isProd ? null : 'dev-secret'),
  mongodbUri: process.env.MONGODB_URI || null,
  dataDir: process.env.DATA_DIR || path.resolve(here, '../../database'),
  uploadDir: process.env.UPLOAD_DIR || path.resolve(here, '../../uploads'),
  isProd,
}

if (isProd && !env.jwtSecret) {
  console.error("FATAL ERROR: JWT_SECRET is required in production.")
  process.exit(1)
}
