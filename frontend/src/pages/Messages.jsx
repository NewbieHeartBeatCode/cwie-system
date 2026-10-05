import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import Panel from '@/components/common/Panel'
import Button from '@/components/common/Button'
import PageHeader, { Status, ErrorText } from '@/components/common/PageHeader'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { api } from '@/services/api'
import { brand } from '@/styles/theme'
import { ROLES, isStaff } from '@/utils/labels'
import { formatDateTime } from '@/utils/format'
import { inputStyle } from '@/components/form/Field'

// ติดต่อประสานงานระหว่างสถานประกอบการกับมหาวิทยาลัย (กองสหกิจ/Admin)
export default function Messages() {
  const { t } = useTheme()
  const { role } = useAuth()
  const staff = isStaff(role)
  const threads = useApi(staff ? '/messages/threads' : null)
  const companies = useApi(staff ? '/companies' : null)
  const [companyId, setCompanyId] = useState('')

  // กองสหกิจ: เลือกห้องแรกให้อัตโนมัติ
  useEffect(() => {
    if (staff && !companyId && threads.data?.length) setCompanyId(threads.data[0].companyId)
  }, [staff, companyId, threads.data])

  return (
    <div style={{ maxWidth: 1100 }}>
      <PageHeader title={staff ? 'ติดต่อประสานงาน' : 'ติดต่อมหาวิทยาลัย'}
        subtitle={staff ? 'ข้อความจากสถานประกอบการ' : 'ส่งข้อความถึงกองสหกิจศึกษา'} />
      <div style={{ display: 'grid', gridTemplateColumns: staff ? 'minmax(220px, 300px) 1fr' : '1fr', gap: 16, alignItems: 'start' }} className="chat-grid">
        {staff && (
          <Panel style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 12, borderBottom: `1px solid ${t.line}` }}>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={inputStyle(t)} aria-label="เลือกสถานประกอบการ">
                <option value="">— เริ่มคุยกับสถานประกอบการ —</option>
                {companies.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Status loading={threads.loading} error={threads.error} empty={threads.data?.length === 0 && 'ยังไม่มีข้อความ'}>
              {threads.data?.map((th) => (
                <button key={th.companyId} onClick={() => setCompanyId(th.companyId)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', borderBottom: `1px solid ${t.line}`, cursor: 'pointer',
                    background: th.companyId === companyId ? brand.oxblood + '12' : 'transparent', color: t.ink }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{th.companyName}</div>
                  <div style={{ fontSize: 12.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{th.last.text}</div>
                </button>
              ))}
            </Status>
          </Panel>
        )}
        {staff && !companyId
          ? <Panel style={{ padding: 30, color: t.muted, textAlign: 'center' }}>เลือกสถานประกอบการเพื่อดูข้อความ</Panel>
          : <Chat companyId={staff ? companyId : null} onSent={threads.reload} />}
      </div>
    </div>
  )
}

function Chat({ companyId, onSent }) {
  const { t } = useTheme()
  const { user } = useAuth()
  const { data, loading, error, reload } = useApi(companyId ? `/messages?companyId=${companyId}` : '/messages')
  const [text, setText] = useState('')
  const [sendError, setSendError] = useState('')
  const end = useRef(null)

  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [data])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    try {
      await api.post('/messages', { text, companyId })
      setText('')
      setSendError('')
      reload()
      onSent?.()
    } catch (err) {
      setSendError(err.message)
    }
  }

  return (
    <Panel style={{ display: 'flex', flexDirection: 'column', height: 'min(560px, 70vh)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'grid', gap: 10, alignContent: 'start' }}>
        <Status loading={loading && !data} error={error} empty={data?.length === 0 && 'ยังไม่มีข้อความ เริ่มพิมพ์ได้เลย'}>
          {data?.map((m) => {
            const mine = m.senderId === user.id
            return (
              <div key={m.id} style={{ justifySelf: mine ? 'end' : 'start', maxWidth: '78%' }}>
                <div style={{ fontSize: 12, color: t.muted, marginBottom: 3, textAlign: mine ? 'right' : 'left' }}>
                  {m.senderName} · {ROLES[m.senderRole]} · {formatDateTime(m.createdAt)}
                </div>
                <div style={{ padding: '9px 13px', borderRadius: 12, fontSize: 14, whiteSpace: 'pre-wrap',
                  background: mine ? brand.oxblood : t.surface2, color: mine ? '#fff' : t.ink, border: mine ? 'none' : `1px solid ${t.line}` }}>
                  {m.text}
                </div>
              </div>
            )
          })}
        </Status>
        <div ref={end} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${t.line}`, flexWrap: 'wrap' }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="พิมพ์ข้อความ..." aria-label="ข้อความ" style={{ ...inputStyle(t), flex: 1, minWidth: 180 }} />
        <Button type="submit" icon={Send} disabled={!text.trim()}>ส่ง</Button>
        {sendError && <div style={{ width: '100%' }}><ErrorText>{sendError}</ErrorText></div>}
      </form>
    </Panel>
  )
}
