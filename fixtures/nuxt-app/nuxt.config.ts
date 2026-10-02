import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  telemetry: false,
  modules: ['kdesign/nuxt'],
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss()] }
})
