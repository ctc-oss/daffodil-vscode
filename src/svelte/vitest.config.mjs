import { defineConfig, mergeConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import viteConfig from './vite.config.mjs'
function printResolvedConfig() {
    return {
        name: 'print-resolved-config',
        configResolved(config) {
            console.log('\n=== RESOLVED VITE CONFIG ===')
            console.log('root:', config.root)
            console.log('plugins:', config.plugins.map(p => p.name))
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
            plugins: [printResolvedConfig()],
            resolve:
            {

                tsconfigPaths: true,
                alias: {

                    '@': fileURLToPath(new URL('./src', import.meta.url)),
                    utilities: fileURLToPath(new URL('./src/utilities', import.meta.url)),
                    layout: fileURLToPath(new URL('./src/components/layouts', import.meta.url)),
                    HTMLWrappers: fileURLToPath(new URL('./src/components/html', import.meta.url)),
                    editor_components: fileURLToPath(new URL('./src/components', import.meta.url)),
                    ext_types: fileURLToPath(new URL('../ext_types', import.meta.url)),
                    stores: fileURLToPath(new URL('./src/stores', import.meta.url)),

                },
            },
            test: {

                environment: 'jsdom',
                globals: true,
                root: fileURLToPath(new URL('.', import.meta.url)),
                alias: {

                    '@': fileURLToPath(new URL('./src', import.meta.url)),
                    utilities: fileURLToPath(new URL('./src/utilities', import.meta.url)),
                    layout: fileURLToPath(new URL('./src/components/layouts', import.meta.url)),
                    HTMLWrappers: fileURLToPath(new URL('./src/components/html', import.meta.url)),
                    editor_components: fileURLToPath(new URL('./src/components', import.meta.url)),
                    ext_types: fileURLToPath(new URL('../ext_types', import.meta.url)),
                    stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
                },
                //   include: ['**/*.svelte.test.ts'],
                include: ['./tests/**/*.svelte.test.ts'],
                exclude: ['node_modules/**', 'out/**'],
                typecheck: {
                    enabled: true,
                    tsconfig: './tsconfig.json',
                    include: ['./tests/**/*.svelte.test.ts'],
                    ignoreSourceErrors: true,
                },
            },
        }
    )
})
