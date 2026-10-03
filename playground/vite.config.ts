import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { benchlight } from '../vite/index.js'

export default defineConfig({ plugins: [vue(), benchlight()] })
