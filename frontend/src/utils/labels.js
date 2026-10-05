// ป้ายชื่อภาษาไทยของค่าต่าง ๆ ในระบบ — role ต้องตรงกับ backend/src/config/roles.js

// ข้อมูลจริงของมหาวิทยาลัย (อ้างอิง: เว็บไซต์คณะวิศวกรรมศาสตร์ en.rmutr.ac.th และกองสหกิจศึกษา coop.rmutr.ac.th)
export const UNIVERSITY = {
  name: 'มหาวิทยาลัยเทคโนโลยีราชมงคลรัตนโกสินทร์',
  short: 'มทร.รัตนโกสินทร์',
  faculty: 'คณะวิศวกรรมศาสตร์',
  campus: 'ศาลายา',
  address: '96 หมู่ 3 ถนนพุทธมณฑล สาย 5 ตำบลศาลายา อำเภอพุทธมณฑล จังหวัดนครปฐม 73170',
  cwieUnit: 'กองสหกิจศึกษา มทร.รัตนโกสินทร์',
  cwieEmail: 'coop@rmutr.ac.th',
}

// สาขาวิชาระดับปริญญาตรีที่เปิดสอนจริงของคณะวิศวกรรมศาสตร์ — seed.js ใช้ชื่อเดียวกัน
export const PROGRAMS = [
  'วิศวกรรมคอมพิวเตอร์',
  'วิศวกรรมปัญญาประดิษฐ์',
  'วิศวกรรมไฟฟ้า',
  'วิศวกรรมโทรคมนาคม',
  'วิศวกรรมเมคคาทรอนิกส์',
  'วิศวกรรมการวัดคุม',
  'วิศวกรรมเครื่องกล',
  'วิศวกรรมโยธา',
  'วิศวกรรมอุตสาหการ',
  'วิศวกรรมอุตสาหการและการผลิต',
  'วิศวกรรมโลจิสติกส์',
  'วิศวกรรมวัสดุ (ปิโตรเคมีภัณฑ์และพอลิเมอร์)',
]

export const ROLES = {
  admin: 'Admin',
  student: 'นักศึกษา CWIE',
  advisor: 'อาจารย์นิเทศ CWIE',
  employer: 'สถานประกอบการ',
  counselor: 'อาจารย์ที่ปรึกษา CWIE',
  office: 'กองสหกิจศึกษา CWIE',
}

// สมัครเองได้จากหน้าเว็บ (บทบาทอื่น Admin/กองสหกิจสร้างบัญชีให้)
export const SELF_REGISTER_ROLES = ['student', 'employer']

// บทบาทที่กองสหกิจจัดการบัญชีได้ (Admin ได้ทุกบทบาท)
export const OFFICE_MANAGED_ROLES = ['student', 'advisor', 'counselor', 'employer']

export const isStaff = (role) => role === 'admin' || role === 'office'

// tone = สีของ Chip
export const PLACEMENT_STATUS = {
  pending_counselor: { label: 'รออาจารย์ที่ปรึกษารับรอง', tone: 'warn' },
  pending_office:    { label: 'รอกองสหกิจอนุมัติ', tone: 'warn' },
  pending_company:   { label: 'รอสถานประกอบการยืนยัน', tone: 'warn' },
  active:            { label: 'กำลังปฏิบัติงาน', tone: 'run' },
  completed:         { label: 'เสร็จสิ้น', tone: 'ok' },
  rejected:          { label: 'ไม่ผ่าน / ตีกลับ', tone: 'bad' },
}

// ลำดับขั้นตอนการออกฝึก (แสดงเป็นแถบความคืบหน้า)
export const PLACEMENT_STEPS = [
  { key: 'apply', label: 'ยื่นสมัคร' },
  { key: 'pending_counselor', label: 'ที่ปรึกษารับรอง' },
  { key: 'pending_office', label: 'กองสหกิจอนุมัติ' },
  { key: 'pending_company', label: 'สถานประกอบการยืนยัน' },
  { key: 'active', label: 'ปฏิบัติงาน' },
  { key: 'completed', label: 'เสร็จสิ้น' },
]

export const DOC_STATUS = {
  submitted: { label: 'รอตรวจสอบ', tone: 'warn' },
  certified: { label: 'รับรองแล้ว รออนุมัติ', tone: 'run' },
  approved:  { label: 'อนุมัติแล้ว', tone: 'ok' },
  returned:  { label: 'ตีกลับให้แก้ไข', tone: 'bad' },
}

export const STAGES = {
  before: 'ก่อนออกสหกิจ',
  during: 'ระหว่างสหกิจ',
  after: 'หลังสหกิจ',
}

export const KINDS = {
  announcement: 'ประกาศ',
  schedule: 'กำหนดการ',
}

export const SUPERVISION_CHANNELS = ['เข้าพบ ณ สถานประกอบการ', 'นิเทศออนไลน์ (วิดีโอคอล)', 'โทรศัพท์']
