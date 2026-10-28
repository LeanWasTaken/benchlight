import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// vmThreads builds happy-dom once per worker instead of once per file, which roughly halves the
// run. @tailwindcss/node calls module.registerHooks, which vmThreads does not provide, so the
// files that import it stay on the default pool.
const forksOnly = ['tests/render-tokens.test.ts']

export default defineConfig({
  plugins: [vue()],
  test: {
    // dist/vue and dist/nuxt are built, not committed; the Nuxt module test reads the component list.
    globalSetup: ['tests/global-setup.ts'],
    environment: 'happy-dom',
    projects: [
      {
        extends: true,
        test: { name: 'vm', pool: 'vmThreads', include: ['tests/**/*.test.ts'], exclude: forksOnly }
      },
      { extends: true, test: { name: 'forks', include: forksOnly } }
    ]
  }
})
