import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { benchlight } from '../vite/index.js'

export default defineConfig({
  plugins: [vue(), benchlight()],
  build: {
    // Vite 8's default CSS target lowers `:dir(rtl)` to a `:lang(...)` list, which ignores `dir="rtl"`.
    cssTarget: ['chrome120', 'firefox121', 'safari17'],
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        stress: resolve(__dirname, 'stress.html'),
        reset: resolve(__dirname, 'reset.html')
      }
    }
  }
})
