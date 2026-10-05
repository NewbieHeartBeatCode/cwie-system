import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// alias @ -> src เผื่อ import ยาว ๆ จะได้สั้นลง
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // ส่ง /api ต่อไปที่ backend จะได้ไม่ติด CORS และไม่ต้องตั้ง .env ตอน dev
  // พอร์ต backend เปลี่ยนได้ด้วย API_PORT (ค่าเริ่มต้น 4000)
  server: { port: 5173, proxy: { '/api': `http://localhost:${process.env.API_PORT || 4000}` } },
})
