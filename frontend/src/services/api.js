// ตัวกลางเรียก backend (dev: vite proxy /api -> backend)
const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'cwie_token'

// โหมดทดสอบ (pretest, เฉพาะตอน dev): แต่ละกรอบในหน้า /pretest เปิดด้วย ?pretest=<role>
// จำ role ไว้ใน window.name (อยู่รอดตอนรีเฟรชกรอบ) และเก็บ token ในหน่วยความจำของกรอบนั้นเอง
// จะได้ login คนละ role พร้อมกันได้ในเบราว์เซอร์เดียว
const fromUrl = import.meta.env.DEV && new URLSearchParams(location.search).get('pretest')
if (fromUrl) window.name = 'pretest:' + fromUrl
export const pretestRole = import.meta.env.DEV && window.name.startsWith('pretest:') ? window.name.slice(8) : null

let memoryToken = null

// ปกติเก็บ token ใน sessionStorage = แยกต่อแท็บ (แต่ละแท็บ login คนละ role ได้)
export const tokenStore = pretestRole
  ? { get: () => memoryToken, set: (token) => { memoryToken = token }, clear: () => { memoryToken = null } }
  : {
    get: () => sessionStorage.getItem(TOKEN_KEY),
    set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
    clear: () => sessionStorage.removeItem(TOKEN_KEY),
  }

const authHeader = () => {
  const token = tokenStore.get()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = authHeader()
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, { method, headers, body: form || (body && JSON.stringify(body)) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด (' + res.status + ')')
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  // ส่งไฟล์ (FormData)
  upload: (path, form, method = 'POST') => request(path, { method, form }),

  // ดาวน์โหลดไฟล์ที่ต้อง login (แนบ token ไปด้วย แล้วให้เบราว์เซอร์บันทึก)
  async download(path, fileName) {
    const res = await fetch(BASE + path, { headers: authHeader() })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'ดาวน์โหลดไม่สำเร็จ')
    const url = URL.createObjectURL(await res.blob())
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
    a.click()
    URL.revokeObjectURL(url)
  },
}
