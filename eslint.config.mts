import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'
import obsidianmd from 'eslint-plugin-obsidianmd'

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['esbuild.config.mjs', 'vitest.config.ts', 'eslint.config.mts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    extends: [
      ...obsidianmd.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'obsidianmd/ui/sentence-case': ['warn', { ignoreWords: ['Omnisearch'] }],
    },
  },
  {
    files: ['vitest.config.ts', 'eslint.config.mts'],
    rules: { 'obsidianmd/no-nodejs-modules': 'off' },
  },
])
