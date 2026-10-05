import { useTheme } from '@/context/ThemeContext'
import { brand } from '@/styles/theme'

export default function Chip({ tone = 'idle', children }) {
  const { t } = useTheme()
  const tones = {
    ok:   { bg: '#1f9d4d22', fg: '#1f9d4d',   bd: '#1f9d4d55' },
    warn: { bg: '#C9A22722', fg: '#9a7a12',   bd: '#C9A22755' },
    run:  { bg: '#2f6db522', fg: '#2f6db5',   bd: '#2f6db555' },
    bad:  { bg: '#A3162118', fg: brand.bright, bd: '#A3162140' },
    idle: { bg: t.surface2,  fg: t.muted,      bd: t.line },
  }
  const c = tones[tone] || tones.idle
  return (
    <span style={{ background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      padding: '3px 10px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

// Chip จากตารางสถานะใน utils/labels.js เช่น <StatusChip map={DOC_STATUS} value="approved" />
export function StatusChip({ map, value }) {
  const s = map[value] || { label: value, tone: 'idle' }
  return <Chip tone={s.tone}>{s.label}</Chip>
}
