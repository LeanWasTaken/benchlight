import { defineConfig } from '@playwright/test'

const viewport = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 }
}

export default defineConfig({
  testDir: 'tests/visual',
  // Font rasterisation differs per OS, so each platform keeps its own baselines.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{projectName}-{platform}{ext}',
  forbidOnly: !!process.env.CI,
  use: { baseURL: 'http://localhost:4173', reducedMotion: 'reduce' },
  webServer: {
    command: 'bunx vite build playground && bunx vite preview playground --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true
  },
  projects: [
    { name: 'desktop-light', use: { viewport: viewport.desktop, colorScheme: 'light' } },
    { name: 'desktop-dark', use: { viewport: viewport.desktop, colorScheme: 'dark' } },
    { name: 'mobile-light', use: { viewport: viewport.mobile, colorScheme: 'light' } },
    { name: 'mobile-dark', use: { viewport: viewport.mobile, colorScheme: 'dark' } }
  ]
})
