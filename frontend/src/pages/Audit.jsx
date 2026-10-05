import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import Panel from '@/components/common/Panel'
import PageHeader, { Status } from '@/components/common/PageHeader'
import FilterBar, { matches } from '@/components/common/FilterBar'
import { useTheme } from '@/context/ThemeContext'
import { useApi } from '@/hooks/useApi'
import { brand } from '@/styles/theme'
import { ROLES } from '@/utils/labels'
import { formatDateTime } from '@/utils/format'

// ประวัติการใช้งานระบบ (Admin)
export default function Audit() {
  const { t } = useTheme()
  const { data, loading, error } = useApi('/audit')
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const rows = data?.filter((a) => (!role || a.role === role) && matches(q, a.action, a.actorName))

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="ประวัติการใช้งานระบบ" subtitle="บันทึกทุกการกระทำสำคัญในระบบ เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้ (แสดง 500 รายการล่าสุด)" />
      <FilterBar search={q} onSearch={setQ} onFilter={(_, v) => setRole(v)}
        filters={[{ key: 'role', label: 'บทบาท', value: role, options: Object.entries(ROLES).map(([value, label]) => ({ value, label })) }]} />
      <Panel style={{ padding: 0 }}>
        <Status loading={loading} error={error} empty={rows?.length === 0 && 'ยังไม่มีประวัติ'}>
          {rows?.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 14, padding: '13px 20px', borderTop: i ? `1px solid ${t.line}` : 'none' }}>
              <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: '50%', background: brand.oxblood + '16', color: brand.bright, display: 'grid', placeItems: 'center' }}>
                <ShieldCheck size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{a.action}</div>
                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>{a.actorName} · {ROLES[a.role] || '-'} · {formatDateTime(a.createdAt)}</div>
              </div>
            </div>
          ))}
        </Status>
      </Panel>
    </div>
  )
}
