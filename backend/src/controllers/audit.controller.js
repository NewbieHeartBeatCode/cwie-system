import { db } from '../config/db.js'

export function list(req, res) {
  res.json(db.auditLogs.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500))
}
