import vue from '@vitejs/plugin-vue'
import { kdesign } from 'kdesign/vite'
import { defineConfig } from 'vite'

export default defineConfig({ plugins: [vue(), kdesign()] })
