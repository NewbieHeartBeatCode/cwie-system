import { createContext, useContext, useState } from 'react'
import { light, dark } from '@/styles/theme'

const ThemeCtx = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false)
  const t = isDark ? dark : light
  const toggle = () => setIsDark(v => !v)
  return <ThemeCtx.Provider value={{ t, isDark, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
