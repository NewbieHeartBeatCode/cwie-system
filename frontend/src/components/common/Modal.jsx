import { X } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

// หน้าต่างฟอร์มกลางจอ — footer = ปุ่มด้านล่าง
export default function Modal({ title, subtitle, onClose, footer, children, width = 540 }) {
  const { t } = useTheme()
  return (
    <div className="no-print" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}
        style={{ width: '100%', maxWidth: width, background: t.surface, color: t.ink, borderRadius: 16,
          border: `1px solid ${t.line}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: t.muted }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="ปิด" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: t.muted, cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>
        <div style={{ padding: 20, display: 'grid', gap: 14, overflow: 'auto' }}>{children}</div>
        {footer && (
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.line}`, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
