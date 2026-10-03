import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: [
      'dist/**',
      '.pack/**',
      'js/prepaint.js',
      'fixtures/**',
      'playground/dist/**',
      'test-results/**',
      'playwright-report/**',
      'docs/**',
      '.remember/**',
      '.omc/**',
      '.superpowers/**'
    ]
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { globals: globals.browser, parserOptions: { parser: tseslint.parser } },
    rules: { 'vue/require-default-prop': 'off' }
  },
  { files: ['js/**/*.js'], languageOptions: { sourceType: 'script', globals: globals.browser } },
  { files: ['vite/**/*.js', 'scripts/**/*.ts'], languageOptions: { globals: globals.node } },
  prettier
)
