import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'

/// <reference types="vitest/config"/>
export default defineConfig(({ mode }) => {
    return {
        root: fileURLToPath(new URL('./', import.meta.url)),
        plugins: [svelte({ configFile: './svelte.config.mjs' })],
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
                tsconfig: './src/svelte/tsconfig.json',
                include: ['./src/svelte/tests/**/*.svelte.test.ts'],
                ignoreSourceErrors: true,
            },
        },
    }
})

