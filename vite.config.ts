import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Disable code-splitting so content/background are single classic files
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: (chunk) => {
          const name = chunk.name || 'index'
          return `${name}.js`
        },
        // no chunkFileNames to avoid ESM imports from content script
        assetFileNames: 'assets/[name][extname]'
      },
      input: {
        popup: 'index.html',
        background: 'src/background.ts',
        contentScript: 'src/contentScript.ts',
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    manifest: false
  }
})


