import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Avoid os.networkInterfaces() enumeration issues on some Node/OS setups.
    host: '127.0.0.1',
  },
})
