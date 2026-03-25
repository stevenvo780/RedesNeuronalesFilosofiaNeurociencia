import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // Redirect bare 'katex' imports to a shim that uses the CDN-loaded global.
      // This prevents Rolldown from bundling/breaking KaTeX's function registry.
      { find: /^katex$/, replacement: path.resolve(__dirname, 'src/katex-shim.js') },
    ],
  },
})
