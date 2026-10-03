import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { kdesign } from '../vite/index.js'

export default defineConfig({ plugins: [vue(), kdesign()] })
