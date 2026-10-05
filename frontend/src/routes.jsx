import { Routes, Route } from 'react-router-dom'
import {
  LayoutDashboard, UserRound, Megaphone, FileDown, Briefcase, Users, FileText, Building2,
  UserCog, MessagesSquare, BarChart3, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Dashboard from '@/pages/Dashboard'
import Profile from '@/pages/Profile'
import Announcements from '@/pages/Announcements'
import Forms from '@/pages/Forms'
import MyCwie from '@/pages/MyCwie'
import PlacementList from '@/pages/placements/PlacementList'
import PlacementDetail from '@/pages/placements/PlacementDetail'
import Documents from '@/pages/Documents'
import Companies from '@/pages/Companies'
import UserManagement from '@/pages/Users'
import Messages from '@/pages/Messages'
import Reports from '@/pages/Reports'
import Audit from '@/pages/Audit'

const ALL = ['admin', 'office', 'student', 'advisor', 'counselor', 'employer']

// หน้า + เมนู + สิทธิ์ของแต่ละ role รวมไว้ที่เดียว (Sidebar และชื่อหน้าบน Navbar ใช้ตัวนี้)
// label เป็นข้อความ หรือ { role: ข้อความ, default } ถ้าแต่ละบทบาทเรียกต่างกัน, menu: false = ไม่แสดงในเมนู
export const pages = [
  { path: '/',              icon: LayoutDashboard, element: <Dashboard />,     roles: ALL, label: 'แดชบอร์ด' },
  { path: '/my-cwie',       icon: Briefcase,       element: <MyCwie />,        roles: ['student'], label: 'การฝึก CWIE ของฉัน' },
  { path: '/placements',    icon: Users,           element: <PlacementList />, roles: ['admin', 'office', 'advisor', 'counselor', 'employer'],
    label: { advisor: 'นักศึกษาที่รับผิดชอบ', counselor: 'นักศึกษาในความดูแล', employer: 'นักศึกษาที่เข้าปฏิบัติงาน', default: 'การจับคู่และออกฝึก' } },
  { path: '/placements/:id', element: <PlacementDetail />, roles: ['admin', 'office', 'advisor', 'counselor', 'employer'], label: 'รายละเอียดนักศึกษา', menu: false },
  { path: '/documents',     icon: FileText,        element: <Documents />,     roles: ALL, label: { student: 'เอกสารของฉัน', default: 'เอกสาร' } },
  { path: '/companies',     icon: Building2,       element: <Companies />,     roles: ALL, label: { employer: 'ข้อมูลสถานประกอบการ', default: 'สถานประกอบการ' } },
  { path: '/users',         icon: UserCog,         element: <UserManagement />,         roles: ['admin', 'office', 'advisor', 'counselor', 'employer'],
    label: { admin: 'ผู้ใช้งาน', office: 'ผู้ใช้งาน', counselor: 'รายชื่อนักศึกษา', default: 'รายชื่อผู้ใช้ที่เกี่ยวข้อง' } },
  { path: '/messages',      icon: MessagesSquare,  element: <Messages />,      roles: ['admin', 'office', 'employer'], label: { employer: 'ติดต่อมหาวิทยาลัย', default: 'ติดต่อประสานงาน' } },
  { path: '/reports',       icon: BarChart3,       element: <Reports />,       roles: ['admin', 'office', 'advisor', 'counselor'], label: 'รายงานและสถิติ' },
  { path: '/announcements', icon: Megaphone,       element: <Announcements />, roles: ALL, label: { employer: 'ประกาศ / กำหนดการ', default: 'ประกาศและกำหนดการ' } },
  { path: '/forms',         icon: FileDown,        element: <Forms />,         roles: ALL, label: 'ดาวน์โหลดแบบฟอร์ม' },
  { path: '/profile',       icon: UserRound,       element: <Profile />,       roles: ALL, label: 'ข้อมูลส่วนตัว' },
  { path: '/audit',         icon: ShieldCheck,     element: <Audit />,         roles: ['admin'], label: 'ประวัติการใช้งานระบบ' },
]

export const labelOf = (page, role) => (typeof page.label === 'string' ? page.label : page.label[role] || page.label.default)

export default function AppRoutes() {
  const { role } = useAuth()
  return (
    <Routes>
      {pages.filter((p) => p.roles.includes(role)).map((p) => (
        <Route key={p.path} path={p.path} element={p.element} />
      ))}
      <Route path="*" element={<div style={{ padding: 40 }}>ไม่พบหน้านี้ หรือไม่มีสิทธิ์เข้าถึง</div>} />
    </Routes>
  )
}
