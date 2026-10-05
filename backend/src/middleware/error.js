// จับ error รวมที่เดียว จะได้ไม่ต้อง try/catch ซ้ำทุก controller
export function errorHandler(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'ไฟล์ใหญ่เกิน 10 MB' })
  if (!err.status) console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'server error' })
}

export function notFound(req, res) {
  res.status(404).json({ message: 'ไม่พบ endpoint นี้' })
}
