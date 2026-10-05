import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/error.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendPath = path.resolve(__dirname, '../../frontend/dist')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', routes)

// Serve frontend if dist exists (e.g. in production)
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

export default app
