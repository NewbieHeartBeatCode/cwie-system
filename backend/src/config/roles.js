// role ทั้งหมดในระบบ — ต้องตรงกับ frontend/src/utils/labels.js
export const ROLES = {
  admin: 'Admin',
  student: 'นักศึกษา CWIE',
  advisor: 'อาจารย์นิเทศ CWIE',
  employer: 'สถานประกอบการ',
  counselor: 'อาจารย์ที่ปรึกษา CWIE',
  office: 'กองสหกิจศึกษา CWIE',
}

// role ที่สมัครเองได้จากหน้าเว็บ (ที่เหลือ Admin / กองสหกิจเป็นคนสร้างบัญชีให้)
export const SELF_REGISTER_ROLES = ['student', 'employer']

// role ที่กองสหกิจจัดการบัญชีได้ (Admin จัดการได้ทุก role)
export const OFFICE_MANAGED_ROLES = ['student', 'advisor', 'counselor', 'employer']

// ผู้ดูแลส่วนกลาง เห็นข้อมูลทั้งหมด
export const isStaff = (user) => user.role === 'admin' || user.role === 'office'
