// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))
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
export default defineConfig({
root: fileURLToPath(new URL('.', import.meta.url)),
plugins:[printResolvedConfig()],
  test: {
    projects: [
      'src/svelte/vitest.config.mjs',
      {
        test: {
          name: 'core',
          environment: 'node',
          include: ['./src/tests/**/*.test.ts'],
          alias: {
            // vscode: r('./tests/mocks/vscode.ts'),
          },
        },
      },
    ],
  },
})
