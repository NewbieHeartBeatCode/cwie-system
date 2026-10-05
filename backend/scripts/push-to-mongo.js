import fs from 'node:fs'
import path from 'node:path'
import { MongoClient, GridFSBucket } from 'mongodb'
import { env } from '../src/config/env.js'

if (!env.mongodbUri) {
  console.error('ERROR: MONGODB_URI is not set in environment.')
  process.exit(1)
}

const TABLES = [
  'users',
  'companies',
  'placements',
  'documents',
  'forms',
  'announcements',
  'activities',
  'supervisions',
  'evaluations',
  'advices',
  'messages',
  'auditLogs',
]

const fileOf = (table) => path.join(env.dataDir, `${table}.json`)

async function run() {
  console.log(`Connecting to MongoDB...`)
  const client = new MongoClient(env.mongodbUri)
  await client.connect()
  const db = client.db()
  console.log(`Connected to ${db.databaseName}`)

  for (const table of TABLES) {
    const file = fileOf(table)
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8').trim() || '[]')
      if (data.length > 0) {
        console.log(`Pushing ${data.length} records to collection '${table}'...`)
        const col = db.collection(table)
        // Upsert by id
        for (const doc of data) {
          await col.updateOne({ id: doc.id }, { $set: doc }, { upsert: true })
        }
      }
    }
  }

  // Upload files to GridFS
  if (fs.existsSync(env.uploadDir)) {
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' })
    const files = fs.readdirSync(env.uploadDir)
    console.log(`Found ${files.length} files in uploads directory.`)

    for (const filename of files) {
      const p = path.join(env.uploadDir, filename)
      if (fs.statSync(p).isFile()) {
        const existing = await bucket.find({ filename }).toArray()
        if (existing.length === 0) {
          console.log(`Uploading ${filename} to GridFS...`)
          const stream = bucket.openUploadStream(filename)
          const readStream = fs.createReadStream(p)
          await new Promise((resolve, reject) => {
            readStream.pipe(stream).on('error', reject).on('finish', resolve)
          })
        }
      }
    }
  }

  console.log('Migration complete.')
  await client.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
