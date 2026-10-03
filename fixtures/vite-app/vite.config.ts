import vue from '@vitejs/plugin-vue'
import { benchlight } from 'benchlight/vite'
import { defineConfig } from 'vite'

export default defineConfig({ plugins: [vue(), benchlight()] })
