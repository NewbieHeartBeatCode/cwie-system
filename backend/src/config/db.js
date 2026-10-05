import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { env } from './env.js'
import { MongoClient } from 'mongodb'

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

const cache = {}
let mongoClient = null
let mongoDb = null
let isReady = false

const useMongo = !!env.mongodbUri
const fileOf = (table) => path.join(env.dataDir, `${table}.json`)

export async function initDb() {
  if (useMongo) {
    try {
      console.log('Connecting to MongoDB...')
      mongoClient = new MongoClient(env.mongodbUri)
      await mongoClient.connect()
      mongoDb = mongoClient.db()
      console.log('MongoDB connected successfully.')

      for (const table of TABLES) {
        const data = await mongoDb.collection(table).find({}).toArray()
        cache[table] = data.map(doc => {
          const { _id, ...rest } = doc
          return rest
        })
      }
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err)
      process.exit(1)
    }
  } else {
    fs.mkdirSync(env.dataDir, { recursive: true })
    
    // Convert combined db.json to separated files if it exists
    const combined = path.join(env.dataDir, 'db.json')
    if (fs.existsSync(combined)) {
      const data = JSON.parse(fs.readFileSync(combined, 'utf8').trim() || '{}')
      for (const t of TABLES) fs.writeFileSync(fileOf(t), JSON.stringify(data[t] || [], null, 2), 'utf8')
      fs.rmSync(combined)
    }

    for (const table of TABLES) {
      const file = fileOf(table)
      if (fs.existsSync(file)) {
        cache[table] = JSON.parse(fs.readFileSync(file, 'utf8').trim() || '[]')
      } else {
        cache[table] = []
      }
    }
  }
  isReady = true
}

export async function getGridFS() {
  if (!useMongo || !mongoDb) return null
  const { GridFSBucket } = await import('mongodb')
  return new GridFSBucket(mongoDb, { bucketName: 'uploads' })
}

function collection(name) {
  const all = () => {
    if (!isReady) throw new Error("Database not ready")
    return cache[name]
  }

  const syncToMongo = (operation, data) => {
    if (!useMongo) return
    Promise.resolve().then(async () => {
      try {
        const col = mongoDb.collection(name)
        if (operation === 'insert') {
           await col.insertOne(data)
        } else if (operation === 'update') {
           await col.updateOne({ id: data.id }, { $set: data }, { upsert: true })
        } else if (operation === 'remove') {
           await col.deleteOne({ id: data })
        }
      } catch (err) {
        console.error(`MongoDB sync error for ${name}:`, err)
      }
    })
  }

  const saveLocal = (rows) => {
    if (useMongo) return
    const file = fileOf(name)
    const tempFile = `${file}.tmp`
    fs.writeFileSync(tempFile, JSON.stringify(rows, null, 2), 'utf8')
    fs.renameSync(tempFile, file)
  }

  return {
    all,
    find: (pred) => all().filter(pred),
    findOne: (pred) => all().find(pred),
    get: (id) => all().find((r) => r.id === id),
    count: (pred) => all().filter(pred).length,
    insert(data) {
      const rows = all()
      const row = { id: crypto.randomUUID(), ...data, createdAt: data.createdAt || new Date().toISOString() }
      rows.push(row)
      saveLocal(rows)
      syncToMongo('insert', row)
      return row
    },
    update(id, patch) {
      const rows = all()
      const i = rows.findIndex((r) => r.id === id)
      if (i < 0) return null
      rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() }
      saveLocal(rows)
      syncToMongo('update', rows[i])
      return rows[i]
    },
    remove(id) {
      const rows = all()
      cache[name] = rows.filter((r) => r.id !== id)
      saveLocal(cache[name])
      syncToMongo('remove', id)
      return cache[name].length
    },
    save(rows) {
      cache[name] = rows
      saveLocal(rows)
      if (useMongo) {
         console.warn(`Collection ${name}: save(rows) called directly. This is not fully synced to Mongo. Use insert/update/remove.`)
      }
    }
  }
}

export const db = Object.fromEntries(TABLES.map((t) => [t, collection(t)]))
