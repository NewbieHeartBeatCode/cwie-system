import app from './app.js'
import { env } from './config/env.js'
import { initDb } from './config/db.js'

initDb().then(() => {
  app.listen(env.port, () => {
    console.log(`API พร้อมใช้งานที่ http://localhost:${env.port}/api`)
  })
})
