// บัญชีที่หน้า /pretest ใช้ login อัตโนมัติ (สร้างโดย backend: npm run seed)
export const PRETEST_PASSWORD = '123456'

export const PRETEST_ACCOUNTS = [
  { role: 'student', email: 'student@cwie.test' },
  { role: 'advisor', email: 'advisor@cwie.test' },
  { role: 'counselor', email: 'counselor@cwie.test' },
  { role: 'employer', email: 'employer@cwie.test' },
  { role: 'office', email: 'office@cwie.test' },
  { role: 'admin', email: 'admin@cwie.test' },
]

export const pretestEmail = (role) => PRETEST_ACCOUNTS.find((a) => a.role === role)?.email
