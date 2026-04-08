import { defineConfig, mergeConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import viteConfig from './vite.config.mjs'

// Yarn executes from repo root
const r = (p) => fileURLToPath(new URL(p, import.meta.url))
const projectRoot = r('.')

function printResolvedConfig() {
  return {
    name: 'print-resolved-config',
    configResolved(config) {
      console.log('\n=== RESOLVED VITE CONFIG ===')
      console.log('root:', config.root)
      console.log(
        'plugins:',
        config.plugins.map((p) => p.name)
      )
      console.log('resolve.alias:', config.resolve.alias)
      console.log('test config:', config.test)
      console.log('============================\n')
    },
  }
}
/// <reference types="vitest/config"/>
export default defineConfig((env) => {
  return mergeConfig(
    typeof viteConfig === 'function' ? viteConfig(env) : viteConfig,
    {
      root: projectRoot,
      plugins: [
        svelte({ configFile: r('./svelte.config.mjs') }),
        printResolvedConfig(),
      ],
      resolve: {
        tsconfigPaths: true,
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
          utilities: fileURLToPath(new URL('./src/utilities', import.meta.url)),
          layout: fileURLToPath(
            new URL('./src/components/layouts', import.meta.url)
          ),
          HTMLWrappers: fileURLToPath(
            new URL('./src/components/html', import.meta.url)
          ),
          editor_components: fileURLToPath(
            new URL('./src/components', import.meta.url)
          ),
          // ext_types: fileURLToPath(new URL('../ext_types', import.meta.url)),
          // stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
        },
      },
      test: {
        environment: 'jsdom',
        globals: true,
        root: fileURLToPath(new URL('.', import.meta.url)),
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
          utilities: fileURLToPath(new URL('./src/utilities', import.meta.url)),
          layout: fileURLToPath(
            new URL('./src/components/layouts', import.meta.url)
          ),
          HTMLWrappers: fileURLToPath(
            new URL('./src/components/html', import.meta.url)
          ),
          editor_components: fileURLToPath(
            new URL('./src/components', import.meta.url)
          ),
          // ext_types: fileURLToPath(new URL('../ext_types', import.meta.url)),
          // stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
        },
        //   include: ['**/*.svelte.test.ts'],
        include: [
          './src/svelte/**/*.svelte.test.ts',
          './tests/**/*.svelte.test.ts',
          './src/svelte/**/*.test.ts',
          './tests/**/*.test.ts',
        ],
        exclude: ['node_modules/**', 'out/**'],
        typecheck: {
          enabled: true,
          tsconfig: './tsconfig.json',
          include: ['./tests/**/*.svelte.test.ts', '**/*.test-d.ts'],
          ignoreSourceErrors: false,
        },
      },
    }
  )
})
