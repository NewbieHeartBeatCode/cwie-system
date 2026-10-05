// เกณฑ์การประเมินนักศึกษา น้ำหนักรวมแต่ละชุด = 100
export const RUBRICS = {
  employer: [
    { key: 'quality',    label: 'คุณภาพของงาน',                  weight: 25 },
    { key: 'ability',    label: 'ความรู้ความสามารถ',              weight: 20 },
    { key: 'respons',    label: 'ความรับผิดชอบ',                  weight: 20 },
    { key: 'human',      label: 'มนุษยสัมพันธ์และการทำงานเป็นทีม', weight: 15 },
    { key: 'discipline', label: 'ระเบียบวินัยและการตรงต่อเวลา',     weight: 20 },
  ],
  advisor: [
    { key: 'plan',     label: 'การปฏิบัติงานตามแผน',      weight: 30 },
    { key: 'report',   label: 'รายงานและการนำเสนอ',       weight: 30 },
    { key: 'growth',   label: 'พัฒนาการและการเรียนรู้',    weight: 20 },
    { key: 'attitude', label: 'เจตคติและความรับผิดชอบ',    weight: 20 },
  ],
}

export function gradeOf(total) {
  if (total >= 80) return 'ดีเยี่ยม'
  if (total >= 70) return 'ดี'
  if (total >= 60) return 'พอใช้'
  return 'ต้องปรับปรุง'
}
