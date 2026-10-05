// รวม helper เล็ก ๆ ไว้ตรงนี้

// '2026-10-05' หรือ ISO -> '5 ต.ค. 2569'
export const formatDate = (v) =>
  v ? new Date(v.length === 10 ? v + 'T00:00:00' : v).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

export const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

export const formatSize = (bytes = 0) =>
  bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'

export const today = () => new Date().toLocaleDateString('sv-SE') // yyyy-mm-dd ตามเวลาเครื่อง

// ความคืบหน้าการปฏิบัติงานตามช่วงวันที่ -> { week, weeks, pct }
export function progressOf(startDate, endDate) {
  const start = new Date(startDate), end = new Date(endDate), now = new Date()
  const weeks = Math.max(1, Math.round((end - start) / (7 * 864e5)))
  const week = Math.min(weeks, Math.max(0, Math.ceil((now - start) / (7 * 864e5))))
  return { week, weeks, pct: Math.round((week / weeks) * 100) }
}

// ตัวอักษรแรกของชื่อสำหรับรูปวงกลม — ข้ามคำนำหน้า เช่น นาย, นางสาว, อ., ผศ.ดร.
const TITLES = ['นางสาว', 'นาย', 'นาง', 'ศ.', 'รศ.', 'ผศ.', 'ดร.', 'อ.', 'คุณ']
export function initialOf(name = '') {
  let s = name.trim()
  for (let found = true; found;) {
    found = false
    for (const t of TITLES) if (s.startsWith(t) && s.length > t.length) { s = s.slice(t.length).trim(); found = true }
  }
  return s.charAt(0)
}
