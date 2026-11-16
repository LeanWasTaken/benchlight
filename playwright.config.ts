import { defineConfig, devices } from '@playwright/test'

const behaviourSpecs = /(cross-browser|popover|tooltip|tabs|number-field)\.spec\.ts/

// Parallel worktrees can run side by side with PW_PORT=<free port>.
const port = Number(process.env['PW_PORT'] ?? 4173)

const viewport = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 }
}

export default defineConfig({
  testDir: 'tests/visual',
  // Font rasterisation differs per OS, so each platform keeps its own baselines.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{projectName}-{platform}{ext}',
  forbidOnly: !!process.env['CI'],
  use: { baseURL: `http://localhost:${port}`, reducedMotion: 'reduce' },
  webServer: {
    command: `bunx vite build playground && bunx vite preview playground --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    timeout: 120_000,
    reuseExistingServer: !process.env['CI']
  },
  // The stress suite sets its own viewports, so it runs in one project only.
  projects: [
    { name: 'desktop-light', use: { viewport: viewport.desktop, colorScheme: 'light' } },
    {
      name: 'desktop-dark',
      testIgnore: /stress\.spec\.ts/,
      use: { viewport: viewport.desktop, colorScheme: 'dark' }
    },
    {
      name: 'mobile-light',
      testIgnore: /stress\.spec\.ts/,
      use: { viewport: viewport.mobile, colorScheme: 'light' }
    },
    {
      name: 'mobile-dark',
      testIgnore: /stress\.spec\.ts/,
      use: { viewport: viewport.mobile, colorScheme: 'dark' }
    },
    // Firefox and WebKit run the behaviour specs only (no screenshots), so the fallbacks written
    // for engines without anchor positioning, `closedby` or `overlay` actually execute.
    {
      name: 'firefox',
      testMatch: behaviourSpecs,
      use: { ...devices['Desktop Firefox'], viewport: viewport.desktop, colorScheme: 'light' }
    },
    {
      name: 'webkit',
      testMatch: behaviourSpecs,
      use: { ...devices['Desktop Safari'], viewport: viewport.desktop, colorScheme: 'light' }
    }
  ]
})
