import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production builds are served from GitHub Pages at https://<user>.github.io/daybook/,
// so assets and routes live under /daybook/. Dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/daybook/' : '/',
  plugins: [react()],
}))
