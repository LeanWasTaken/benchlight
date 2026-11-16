import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { benchlight } from '../vite/index.js'

export default defineConfig({
  plugins: [vue(), benchlight()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        stress: resolve(__dirname, 'stress.html'),
        reset: resolve(__dirname, 'reset.html')
      }
    }
  }
})
