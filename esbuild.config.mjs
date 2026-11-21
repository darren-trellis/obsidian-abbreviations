import { copyFileSync, mkdirSync } from 'node:fs'
import { builtinModules } from 'node:module'
import esbuild from 'esbuild'

const prod = process.argv[2] === 'production'

mkdirSync('dist', { recursive: true })
copyFileSync('manifest.json', 'dist/manifest.json')

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtinModules,
  ],
  format: 'cjs',
  target: 'es2021',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  minify: prod,
  outfile: 'dist/main.js',
})

if (prod) {
  await context.rebuild()
  await context.dispose()
} else {
  await context.watch()
}
