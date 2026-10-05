export const httpError = (status, message) => Object.assign(new Error(message), { status })

// เลือกเฉพาะ field ที่อนุญาต (ไม่เอาค่า undefined)
export function pick(obj = {}, keys) {
  return Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]))
}

// ห่อ handler ให้ error ไหลไป errorHandler เอง ไม่ต้อง try/catch ทุกตัว
export const handle = (fn) => (req, res, next) => {
  try {
    const out = fn(req, res, next)
    if (out && typeof out.catch === 'function') out.catch(next)
  } catch (e) {
    next(e)
  }
}
