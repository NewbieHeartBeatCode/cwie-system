// สร้างข้อมูลทดลอง (mock up) ครบทุก role และทุกขั้นตอน — รันซ้ำได้
// ข้อมูลทดลองมี id ขึ้นต้นด้วย "seed-" จะถูกลบแล้วสร้างใหม่ทุกครั้ง (รวมถึงสิ่งที่ผูกกับนักศึกษา/บริษัททดลอง)
// ข้อมูลจริงที่สมัครเองไม่ถูกแตะ — ใช้: npm run seed
import fs from 'node:fs'
import { db, initDb } from '../src/config/db.js'
import { env } from '../src/config/env.js'
import { ROLES } from '../src/config/roles.js'
import { RUBRICS, gradeOf } from '../src/config/rubrics.js'
import { createUser } from '../src/services/user.service.js'
import { filePath } from '../src/middleware/upload.js'

if (env.isProd && process.argv[2] !== '--force') {
  console.error("FATAL: Cannot run seed in production without --force")
  process.exit(1)
}

await initDb()

const PASSWORD = '123456'
const isSeed = (r) => ['id', 'placementId', 'studentId', 'companyId', 'actorId'].some((k) => String(r[k] ?? '').startsWith('seed-'))

// ---------- ล้างข้อมูลทดลองเดิม ----------
for (const c of Object.values(db)) {
  for (const r of c.all().filter(isSeed)) if (r.storedName) fs.rmSync(filePath(r.storedName), { force: true })
  c.save(c.all().filter((r) => !isSeed(r)))
}
// บัญชีทดลองรุ่นเก่า (@cwie.test) และ role ที่ไม่มีในระบบแล้ว
db.users.save(db.users.all().filter((u) => !u.email.endsWith('@cwie.test') && ROLES[u.role]))

// ---------- helper ----------
const at = (date, time = '09:00') => new Date(`${date}T${time}:00+07:00`).toISOString()
const h = (user, date, action, note = '') => ({ at: at(date, '10:00'), byId: user.id, byName: user.fullName, role: user.role, action, note })

// PDF ตัวอย่าง 1 หน้า (ตัวอักษรอังกฤษ) ไว้เป็นไฟล์แนบของเอกสาร/แบบฟอร์มทดลอง
function writePdf(storedName, title) {
  const text = `BT /F1 20 Tf 72 760 Td (CWIE - ${title}) Tj 0 -30 Td /F1 12 Tf (Sample file for testing the CWIE system) Tj ET`
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let out = '%PDF-1.4\n'
  const offsets = objs.map((o, i) => { const pos = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return pos })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  fs.writeFileSync(filePath(storedName), out, 'latin1')
  return { storedName, size: out.length }
}

// ---------- สถานประกอบการ ----------
const companies = [
  { id: 'seed-co1', name: 'บริษัท อินสไปร์ คอมมูนิเคชั่น จำกัด', address: '169/85 หมู่ที่ 7 ถนนพุทธมณฑลสาย 4 ตำบลกระทุ่มล้ม อำเภอสามพราน จ.นครปฐม 73220', phone: '', email: '', contactName: 'ฝ่ายบุคคล', website: 'inspirecomm.co.th', description: 'ให้บริการ จัดหา ติดตั้ง และซ่อมแซม ระบบกล้องวงจรปิดและระบบคอมพิวเตอร์ (MOU กับคณะวิศวกรรมศาสตร์ 09/09/68 - 09/09/71)', verified: true },
  { id: 'seed-co2', name: 'บริษัท เอเพ็กซ์ เซอร์คิต (ไทยแลนด์) จำกัด', address: '30/101, 102 หมู่ 1 ตำบลโคกขาม อำเภอเมืองสมุทรสาคร จ.สมุทรสาคร 74000', phone: '034-119225', email: '', contactName: 'ฝ่ายบุคคล', website: 'apexcircuit.com', description: 'ผู้ผลิตแผงวงจรพิมพ์ (PCB) แบบสองหน้าและหลายชั้น (มี MOU กับคณะวิศวกรรมศาสตร์)', verified: true },
  { id: 'seed-co3', name: 'บริษัท เอ็น.พี. โรโบติกส์ แอนด์ โซลูชั่น จำกัด', address: '189 หมู่ที่ 6 ตำบลปลายนา อำเภอศรีประจันต์ จ.สุพรรณบุรี 72140', phone: '099-653-6399', email: '', contactName: 'ฝ่ายบุคคล', website: 'np-robotics.com', description: 'โซลูชันหุ่นยนต์และระบบอัตโนมัติในอุตสาหกรรม (MOU กับคณะวิศวกรรมศาสตร์ 24/03/69 - 24/03/72)', verified: true },
  { id: 'seed-co4', name: 'บริษัท แมกน่า ออโตโมทีฟ เทคโนโลยี (ประเทศไทย) จำกัด', address: 'นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด อำเภอปลวกแดง จ.ระยอง', phone: '', email: '', contactName: 'ฝ่ายบุคคล', website: 'magna.com', description: 'ผลิตชิ้นส่วนยานยนต์ ในเครือ Magna International (MOU กับคณะวิศวกรรมศาสตร์ 14/05/69 - 14/05/72)', verified: false },
]
companies.forEach((c) => db.companies.insert({ ...c, createdAt: at('2026-09-20') }))

// ---------- ผู้ใช้ ----------
const U = {}
const user = (key, data) => (U[key] = createUser({ password: PASSWORD, createdAt: at('2026-09-28', '09:47'), ...data, id: `seed-${key}` }))
user('admin',  { role: 'admin',     fullName: 'ผู้ดูแลระบบ CWIE',        email: 'admin@cwie.test' })
user('office', { role: 'office',    fullName: 'กองสหกิจศึกษา มทร.รัตนโกสินทร์', email: 'office@cwie.test' })
user('adv1',   { role: 'advisor',   fullName: 'ผศ.ดร.ณัฏฐ์ ตั้งปรีชาพาณิชย์', email: 'advisor@cwie.test', phone: '02-4416000 ต่อ 2680' })
user('adv2',   { role: 'advisor',   fullName: 'อ.ดร.ณัฐพล มีชัย',        email: 'advisor2@cwie.test', phone: '081-222-2222' })
user('cou1',   { role: 'counselor', fullName: 'ผศ.ดร.ณัฏฐ์ ตั้งปรีชาพาณิชย์', email: 'counselor@cwie.test', phone: '02-4416000 ต่อ 2680' })
user('cou2',   { role: 'counselor', fullName: 'ดร.ชัยพิชิต คำพิมพ์', email: 'counselor2@cwie.test', phone: '02-4416000 ต่อ 2680' })
user('emp1',   { role: 'employer',  fullName: 'ฝ่ายบุคคล อินสไปร์ คอมมูนิเคชั่น', email: 'employer@cwie.test', companyId: 'seed-co1' })
user('emp2',   { role: 'employer',  fullName: 'ฝ่ายบุคคล เอเพ็กซ์ เซอร์คิต', email: 'employer2@cwie.test', companyId: 'seed-co2' })
user('emp3',   { role: 'employer',  fullName: 'ฝ่ายบุคคล เอ็น.พี. โรโบติกส์', email: 'employer3@cwie.test', companyId: 'seed-co3' })
user('emp4',   { role: 'employer',  fullName: 'ฝ่ายบุคคล แมกน่า ออโตโมทีฟ', email: 'employer4@cwie.test', companyId: 'seed-co4' })
user('st1',    { role: 'student',   fullName: 'นายชนากร อังกาบ', email: 'student@cwie.test',  studentId: '1671010541134', program: 'วิศวกรรมคอมพิวเตอร์', counselorId: 'seed-cou1', phone: '090-000-0001' })
user('st2',    { role: 'student',   fullName: 'ธนชิต เอี่ยมเจริญศักดิ์', email: 'student2@cwie.test', studentId: '1671010541192', program: 'วิศวกรรมคอมพิวเตอร์', counselorId: 'seed-cou1' })
user('st3',    { role: 'student',   fullName: 'รัชชานนท์ นิยะมะ', email: 'student3@cwie.test', studentId: '1671010541144', program: 'วิศวกรรมคอมพิวเตอร์', counselorId: 'seed-cou2' })
user('st4',    { role: 'student',   fullName: 'นายภาคภูมิ อรุณแสง', email: 'student4@cwie.test', studentId: '1651010541149', program: 'วิศวกรรมคอมพิวเตอร์', counselorId: 'seed-cou2' })
user('st5',    { role: 'student',   fullName: 'อาทิตย์ เจริญธรรม', email: 'student5@cwie.test', studentId: '1671010541122', program: 'วิศวกรรมคอมพิวเตอร์', counselorId: 'seed-cou1' })

// ---------- การออกฝึก (ครบทุกสถานะ) ----------
const place = (key, d) => db.placements.insert({ id: `seed-pl-${key}`, counselorId: U[key].counselorId, note: '', ...d, studentId: U[key].id })
place('st1', {
  companyId: 'seed-co1', advisorId: U.adv1.id, position: 'ผู้ช่วยวิศวกรระบบคอมพิวเตอร์และเครือข่าย', startDate: '2026-08-03', endDate: '2026-11-20', status: 'active',
  createdAt: at('2026-07-01'), history: [
    h(U.st1, '2026-07-01', 'ยื่นสมัครเข้าร่วม CWIE'), h(U.cou1, '2026-07-03', 'อาจารย์ที่ปรึกษารับรอง'),
    h(U.office, '2026-07-08', 'กองสหกิจอนุมัติ'), h(U.emp1, '2026-07-15', 'สถานประกอบการยืนยันรับนักศึกษา')],
})
place('st2', {
  companyId: 'seed-co2', advisorId: U.adv1.id, position: 'ผู้ช่วยวิศวกรข้อมูลการผลิต', startDate: '2026-06-01', endDate: '2026-09-18', status: 'completed',
  createdAt: at('2026-04-20'), history: [
    h(U.st2, '2026-04-20', 'ยื่นสมัครเข้าร่วม CWIE'), h(U.cou1, '2026-04-22', 'อาจารย์ที่ปรึกษารับรอง'),
    h(U.office, '2026-04-28', 'กองสหกิจอนุมัติ'), h(U.emp2, '2026-05-06', 'สถานประกอบการยืนยันรับนักศึกษา'),
    h(U.adv1, '2026-09-21', 'ปฏิบัติงานเสร็จสิ้น')],
})
place('st3', {
  companyId: 'seed-co3', advisorId: U.adv2.id, position: 'ผู้ช่วยวิศวกรระบบหุ่นยนต์และระบบอัตโนมัติ', startDate: '2026-11-02', endDate: '2027-02-26', status: 'pending_company',
  createdAt: at('2026-09-15'), history: [
    h(U.st3, '2026-09-15', 'ยื่นสมัครเข้าร่วม CWIE'), h(U.cou2, '2026-09-17', 'อาจารย์ที่ปรึกษารับรอง'), h(U.office, '2026-09-24', 'กองสหกิจอนุมัติ')],
})
place('st4', {
  companyId: 'seed-co1', advisorId: null, position: 'ผู้ช่วยวิศวกรระบบกล้องวงจรปิด (CCTV)', startDate: '2026-11-02', endDate: '2027-02-26', status: 'pending_counselor',
  createdAt: at('2026-10-01'), history: [h(U.st4, '2026-10-01', 'ยื่นสมัครเข้าร่วม CWIE')],
})
place('st5', {
  companyId: 'seed-co2', advisorId: null, position: 'ผู้ช่วยวิศวกรทดสอบแผงวงจร', startDate: '2026-11-02', endDate: '2027-02-26', status: 'pending_office',
  createdAt: at('2026-09-29'), history: [h(U.st5, '2026-09-29', 'ยื่นสมัครเข้าร่วม CWIE'), h(U.cou1, '2026-10-02', 'อาจารย์ที่ปรึกษารับรอง')],
})

// ---------- เอกสาร ----------
let n = 0
function doc(st, title, stage, status, steps) {
  const id = `seed-doc${++n}`
  const pl = db.placements.get(`seed-pl-${st}`)
  db.documents.insert({
    id, studentId: U[st].id, placementId: pl?.id || null, title, stage,
    fileName: `${title}.pdf`, ...writePdf(`${id}.pdf`, `Document ${n}`), status,
    history: steps.map(([who, date, action, note]) => h(U[who], date, action, note)),
    createdAt: at(steps[0][1]),
  })
}
doc('st1', 'ใบสมัครเข้าร่วมโครงการ CWIE', 'before', 'approved', [['st1', '2026-07-01', 'อัปโหลดเอกสาร'], ['cou1', '2026-07-03', 'ตรวจสอบและรับรองเอกสาร'], ['office', '2026-07-08', 'อนุมัติเอกสาร']])
doc('st1', 'หนังสือตอบรับจากสถานประกอบการ', 'before', 'approved', [['st1', '2026-07-16', 'อัปโหลดเอกสาร'], ['office', '2026-07-18', 'อนุมัติเอกสาร']])
doc('st1', 'แผนการปฏิบัติงาน', 'during', 'certified', [['st1', '2026-08-10', 'อัปโหลดเอกสาร'], ['emp1', '2026-08-12', 'ตรวจสอบและรับรองเอกสาร']])
doc('st1', 'รายงานประจำเดือนที่ 1', 'during', 'returned', [['st1', '2026-09-04', 'อัปโหลดเอกสาร'], ['adv1', '2026-09-08', 'ตีกลับให้แก้ไข', 'กรุณาเพิ่มรายละเอียดงานสัปดาห์ที่ 3-4 และแนบภาพประกอบ']])
doc('st1', 'รายงานประจำเดือนที่ 2', 'during', 'submitted', [['st1', '2026-10-03', 'อัปโหลดเอกสาร']])
doc('st2', 'ใบสมัครเข้าร่วมโครงการ CWIE', 'before', 'approved', [['st2', '2026-04-20', 'อัปโหลดเอกสาร'], ['office', '2026-04-28', 'อนุมัติเอกสาร']])
doc('st2', 'รายงานฉบับสมบูรณ์', 'after', 'approved', [['st2', '2026-09-19', 'อัปโหลดเอกสาร'], ['adv1', '2026-09-22', 'ตรวจสอบและรับรองเอกสาร'], ['office', '2026-09-25', 'อนุมัติเอกสาร']])
doc('st3', 'ใบสมัครเข้าร่วมโครงการ CWIE', 'before', 'approved', [['st3', '2026-09-15', 'อัปโหลดเอกสาร'], ['office', '2026-09-24', 'อนุมัติเอกสาร']])
doc('st4', 'ใบสมัครเข้าร่วมโครงการ CWIE', 'before', 'submitted', [['st4', '2026-10-01', 'อัปโหลดเอกสาร']])
doc('st5', 'ใบสมัครเข้าร่วมโครงการ CWIE', 'before', 'certified', [['st5', '2026-09-29', 'อัปโหลดเอกสาร'], ['cou1', '2026-10-02', 'ตรวจสอบและรับรองเอกสาร']])

// ---------- แบบฟอร์มดาวน์โหลด ----------
;[
  ['แบบฟอร์มใบสมัครเข้าร่วมโครงการ CWIE', 'before', 'กรอกและแนบในระบบก่อนยื่นสมัคร'],
  ['หนังสือขอความอนุเคราะห์รับนักศึกษา', 'before', 'ส่งให้สถานประกอบการพิจารณา'],
  ['แบบบันทึกการปฏิบัติงานประจำสัปดาห์', 'during', 'ใช้บันทึกงานทุกสัปดาห์'],
  ['แบบประเมินผลนักศึกษา (สถานประกอบการ)', 'during', 'สำหรับพนักงานที่ปรึกษาในสถานประกอบการ'],
  ['แบบรายงานฉบับสมบูรณ์', 'after', 'รูปแบบรายงานหลังจบการปฏิบัติงาน'],
].forEach(([title, stage, description], i) => {
  const id = `seed-form${i + 1}`
  db.forms.insert({ id, title, stage, description, fileName: `${title}.pdf`, ...writePdf(`${id}.pdf`, `Form ${i + 1}`), createdAt: at('2026-09-01') })
})

// ---------- ประกาศ / กำหนดการ ----------
;[
  ['seed-an1', 'เปิดรับสมัคร CWIE ภาคเรียนที่ 2/2569', 'announcement', '2026-09-15', 'นักศึกษาที่สนใจยื่นสมัครผ่านระบบได้ถึงวันที่ 15 ต.ค. 2569', null, 'office'],
  ['seed-an2', 'ปฐมนิเทศนักศึกษาก่อนออกปฏิบัติงาน', 'schedule', '2026-10-20', 'ห้องประชุม คณะวิศวกรรมศาสตร์ มทร.รัตนโกสินทร์ ศาลายา เวลา 09:00-12:00 น. (บังคับเข้าร่วมทุกคน)', null, 'office'],
  ['seed-an3', 'กำหนดส่งรายงานฉบับสมบูรณ์', 'schedule', '2027-02-27', 'อัปโหลดไฟล์ PDF ในเมนูเอกสาร หมวดหลังสหกิจ', null, 'office'],
  ['seed-an4', 'ประชุมทีมประจำสัปดาห์', 'schedule', '2026-10-12', 'ทุกวันจันทร์ 10:00 น. ห้องประชุม 3 ชั้น 5', 'seed-co1', 'emp1'],
  ['seed-an5', 'นำเสนอผลงานกลางภาค', 'schedule', '2026-10-30', 'นักศึกษานำเสนอความคืบหน้าโปรเจกต์ 15 นาที', 'seed-co1', 'emp1'],
].forEach(([id, title, kind, date, detail, companyId, author]) =>
  db.announcements.insert({ id, title, kind, date, detail, companyId, authorId: U[author].id, createdAt: at('2026-09-15') }))

// ---------- บันทึกกิจกรรม / การนิเทศ / ข้อเสนอแนะ ----------
const note = (c, id, st, author, date, title, detail) =>
  c.insert({ id, placementId: `seed-pl-${st}`, studentId: U[st].id, authorId: U[author].id, authorRole: U[author].role, date, title, detail, createdAt: at(date, '16:00') })
note(db.activities, 'seed-act1', 'st1', 'emp1', '2026-08-07', 'ปฐมนิเทศและเรียนรู้งาน', 'แนะนำทีม ความปลอดภัยในการทำงาน และศึกษาระบบกล้องวงจรปิดกับเครือข่ายของลูกค้า')
note(db.activities, 'seed-act2', 'st1', 'emp1', '2026-09-04', 'ติดตั้งและตั้งค่าระบบเครือข่าย', 'ร่วมติดตั้งกล้อง IP และตั้งค่า NVR / VLAN ให้ลูกค้า ทำงานได้ตามกำหนด ทำงานร่วมกับทีมได้ดี')
note(db.activities, 'seed-act3', 'st1', 'adv1', '2026-09-25', 'ติดตามความคืบหน้าออนไลน์', 'นักศึกษาปรับตัวได้ดี แนะนำให้จดบันทึกปัญหาที่พบทุกสัปดาห์')
note(db.activities, 'seed-act4', 'st2', 'emp2', '2026-08-14', 'สร้าง Dashboard ข้อมูลการผลิต', 'ใช้ Power BI สรุปข้อมูลสายการผลิตแผงวงจร ได้รับคำชมจากฝ่ายผลิต')
note(db.advices, 'seed-adv1', 'st1', 'cou1', '2026-08-20', 'การวางแผนรายงาน', 'ควรเริ่มเก็บข้อมูลสำหรับรายงานฉบับสมบูรณ์ตั้งแต่ตอนนี้')
note(db.advices, 'seed-adv2', 'st2', 'cou1', '2026-09-22', 'หลังจบการปฏิบัติงาน', 'ผลงานดีมาก แนะนำให้นำ dashboard ไปต่อยอดเป็นโปรเจกต์จบ')

const sup = (id, st, advisor, round, date, channel, result, suggestion) =>
  db.supervisions.insert({ id, placementId: `seed-pl-${st}`, studentId: U[st].id, advisorId: U[advisor].id, round, date, channel, result, suggestion, createdAt: at(date, '15:00') })
sup('seed-sup1', 'st1', 'adv1', 1, '2026-09-10', 'เข้าพบ ณ สถานประกอบการ', 'นักศึกษาได้รับมอบหมายงานตรงสาขา ทำงานได้ตามแผน', 'ฝึกการนำเสนองานให้กระชับขึ้น')
sup('seed-sup2', 'st2', 'adv1', 1, '2026-07-08', 'นิเทศออนไลน์ (วิดีโอคอล)', 'ปรับตัวได้ดี เข้าใจงานวิเคราะห์ข้อมูล', '')
sup('seed-sup3', 'st2', 'adv1', 2, '2026-08-26', 'เข้าพบ ณ สถานประกอบการ', 'ผลงาน dashboard ใช้งานจริงในองค์กร', 'สรุปบทเรียนลงรายงานฉบับสมบูรณ์')

// ---------- ผลการประเมิน ----------
function evaluate(id, st, evaluator, values, comment, date) {
  const role = U[evaluator].role
  const scores = RUBRICS[role].map((r, i) => ({ key: r.key, label: r.label, weight: r.weight, score: values[i] }))
  const total = Math.round(scores.reduce((s, x) => s + (x.score / 100) * x.weight, 0) * 10) / 10
  db.evaluations.insert({ id, placementId: `seed-pl-${st}`, studentId: U[st].id, evaluatorId: U[evaluator].id, evaluatorRole: role, scores, total, grade: gradeOf(total), comment, createdAt: at(date) })
}
evaluate('seed-ev1', 'st2', 'emp2', [90, 85, 92, 88, 95], 'ตั้งใจทำงาน เรียนรู้เร็ว', '2026-09-18')
evaluate('seed-ev2', 'st2', 'adv1', [85, 88, 90, 92], 'รายงานครบถ้วน นำเสนอชัดเจน', '2026-09-24')

// ---------- ติดต่อประสานงาน ----------
db.messages.insert({ id: 'seed-msg1', companyId: 'seed-co1', senderId: U.emp1.id, text: 'สอบถามกำหนดการนิเทศครั้งที่ 2 ของนักศึกษาชนากรครับ', createdAt: at('2026-10-01', '10:15') })
db.messages.insert({ id: 'seed-msg2', companyId: 'seed-co1', senderId: U.office.id, text: 'อาจารย์นิเทศจะเข้าพบช่วงสัปดาห์ที่ 3 ของเดือนตุลาคมค่ะ จะแจ้งวันที่แน่นอนอีกครั้ง', createdAt: at('2026-10-01', '13:40') })

// ---------- ประวัติการใช้งาน (สร้างจากขั้นตอนของการออกฝึกและเอกสารด้านบน) ----------
const logs = [
  ...db.placements.all().filter(isSeed).flatMap((p) => p.history.map((h) => ({ ...h, action: `${h.action}: ${db.users.get(p.studentId).fullName}` }))),
  ...db.documents.all().filter(isSeed).flatMap((d) => d.history.map((h) => ({ ...h, action: `${h.action} "${d.title}"` }))),
].sort((a, b) => a.at.localeCompare(b.at))
logs.forEach((h, i) => db.auditLogs.insert({ id: `seed-log${i + 1}`, actorId: h.byId, actorName: h.byName, role: h.role, action: h.action, createdAt: h.at }))

// ---------- สรุป ----------
console.log('สร้างข้อมูลทดลองเรียบร้อย (รหัสผ่านทุกบัญชี: ' + PASSWORD + ')\n')
for (const u of Object.values(U)) console.log(`  ${u.email.padEnd(22)} ${ROLES[u.role]}`)
