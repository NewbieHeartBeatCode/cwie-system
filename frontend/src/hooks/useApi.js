import { useCallback, useEffect, useState } from 'react'
import { api } from '@/services/api'

// โหลดข้อมูลจาก GET path อัตโนมัติ + reload() ไว้โหลดใหม่หลังแก้ข้อมูล
// path = null -> ยังไม่โหลด
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: '', loading: !!path })

  const reload = useCallback(() => {
    if (!path) return Promise.resolve()
    setState((s) => ({ ...s, loading: true }))
    return api.get(path)
      .then((data) => setState({ data, error: '', loading: false }))
      .catch((e) => setState({ data: null, error: e.message, loading: false }))
  }, [path])

  useEffect(() => { reload() }, [reload])

  return { ...state, reload }
}
