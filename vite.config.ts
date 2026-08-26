import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  // GitHub Pages serves the site at https://raffieeey.github.io/grounded-route/,
  // so built asset URLs must be relative to that subpath. Local preview/dev
  // still works (vite rewrites the base for `vite dev`/`vite preview`).
  base: '/grounded-route/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
