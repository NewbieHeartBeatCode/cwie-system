import { useTheme } from '@/context/ThemeContext'
import Panel from './Panel'
import { Status } from './PageHeader'

// ตารางกลาง: columns = [{ key, label, render?(row), width?, nowrap? }]
export default function Table({ columns, rows, onRowClick, loading, error, empty = 'ยังไม่มีข้อมูล' }) {
  const { t } = useTheme()
  const cell = { padding: '12px 16px', borderBottom: `1px solid ${t.line}`, textAlign: 'left', verticalAlign: 'top' }
  return (
    <Panel style={{ padding: 0, overflowX: 'auto' }}>
      <Status loading={loading && !rows} error={error} empty={rows?.length === 0 && empty}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ color: t.muted, fontSize: 13 }}>
              {columns.map((c) => <th key={c.key} style={{ ...cell, fontWeight: 600, whiteSpace: 'nowrap', width: c.width }}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className={onRowClick ? 'row' : undefined} onClick={onRowClick && (() => onRowClick(r))}>
                {columns.map((c) => (
                  <td key={c.key} style={{ ...cell, whiteSpace: c.nowrap ? 'nowrap' : undefined }}>
                    {c.render ? c.render(r) : r[c.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Status>
    </Panel>
  )
}
