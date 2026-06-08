import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: `npm run dev` serves on :5173 and proxies API calls to Spring Boot on :8080.
// Prod: `npm run build` outputs to dist/, which Maven copies into the Spring Boot jar.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
