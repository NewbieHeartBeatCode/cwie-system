import { useId, useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import { ErrorText } from '@/components/common/PageHeader'
import { Field, inputStyle } from './Field'

// ฟอร์มในหน้าต่าง สร้างจากรายการ field — ใช้กับทุกฟอร์มในระบบ
// field = { key, label, type: text|email|password|date|number|textarea|select|file|info,
//           required, options: [{ value, label }], hidden(values), help, min, max, accept }
// onSubmit(values) คืน promise; error ที่ throw จะแสดงในฟอร์ม, สำเร็จแล้วปิดหน้าต่างเอง
export default function FormModal({ title, subtitle, fields, initial = {}, submitLabel = 'บันทึก', danger, onSubmit, onClose, width }) {
  const { t } = useTheme()
  const formId = useId()
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, initial[f.key] ?? f.default ?? ''])))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }))
  const visible = fields.filter((f) => !f.hidden?.(values))

  const submit = async (e) => {
    e.preventDefault()
    const missing = visible.find((f) => f.required && (values[f.key] === '' || values[f.key] == null))
    if (missing) return setError(`กรุณากรอก "${missing.label}"`)
    setBusy(true)
    setError('')
    try {
      await onSubmit(values)
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const input = (f) => {
    const common = { id: formId + f.key, style: inputStyle(t) }
    switch (f.type) {
      case 'textarea':
        return <textarea {...common} rows={f.rows || 3} value={values[f.key]} onChange={(e) => set(f.key, e.target.value)} style={{ ...common.style, resize: 'vertical' }} />
      case 'select':
        return (
          <select {...common} value={values[f.key]} onChange={(e) => set(f.key, e.target.value)}>
            {f.placeholder !== false && <option value="">— เลือก —</option>}
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )
      case 'file':
        return <input {...common} type="file" accept={f.accept} onChange={(e) => set(f.key, e.target.files[0] || null)} />
      case 'info':
        return <div style={{ fontSize: 14, color: t.muted }}>{f.text}</div>
      default:
        return <input {...common} type={f.type || 'text'} min={f.min} max={f.max} value={values[f.key]}
          onChange={(e) => set(f.key, e.target.value)} />
    }
  }

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose} width={width}
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose}>ยกเลิก</Button>
        <Button type="submit" form={formId} variant={danger ? 'danger' : 'primary'} disabled={busy}>{busy ? 'กำลังบันทึก...' : submitLabel}</Button>
      </>}>
      <form id={formId} onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        {visible.map((f) => (
          <Field key={f.key} label={f.label + (f.required ? ' *' : '')}>
            {input(f)}
            {f.help && <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{f.help}</div>}
          </Field>
        ))}
        <ErrorText>{error}</ErrorText>
      </form>
    </Modal>
  )
}
