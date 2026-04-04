/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/// <reference types="vitest/config"/>

import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import strip from 'rollup-plugin-strip-code'
import { fileURLToPath } from 'url'
import { loadEnvFile } from 'node:process'
import * as fs from 'fs'
const r = (p) => fileURLToPath(new URL(p, import.meta.url))
const envFilePath = path.resolve(__dirname, '.env')

/// <reference types="vitest/config"/>
/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => {
    if (fs.existsSync(envFilePath)) loadEnvFile(envFilePath)
    const debugDataEditor =
        process.env.DEBUG_DATAEDITOR == 'on' && mode === 'development'

    return {
        define: {
            __DEBUG_DATAEDITOR__: JSON.stringify(debugDataEditor),
        },
        // test: {
        //   environment: 'jsdom',
        //   globals: true,
        //   // typecheck: {
        //   //   enabled: true,
        //   //   tsconfig: './tsconfig.json',
        //   //   include: ['./tests/**/*.test.ts'],
        //   //   exclude: ['src/**'],
        //   // },
        //   // include: ['./tests/**/*.svelte.test.ts'],
        //   // exclude: ['./src/**'],
        //   typecheck: {
        //     enabled: true,
        //     tsconfig: './src/svelte/tsconfig.json',
        //     include: ['./src/svelte/tests/**/*.test.ts'],
        //     exclude: ['node_modules/**/*', 'src/svelte/src/**'],
        //   },
        //   include: ['./src/svelte/tests/**/*.svelte.test.ts'],
        //   exclude: ['node_modules/**/*', 'src/svelte/src/**/*'],
        // },
        base: '',
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
                $root: debugDataEditor
                    ? r('./src/App.debug.svelte')
                    : r('./src/App.svelte'),
                utilities: fileURLToPath(new URL('./src/utilities', import.meta.url)),
                layout: fileURLToPath(new URL('./src/components/layouts', import.meta.url)),
                HTMLWrappers: fileURLToPath(new URL('./src/components/html', import.meta.url)),
                editor_components: fileURLToPath(new URL('./src/components', import.meta.url)),
                ext_types: fileURLToPath(new URL('../ext_types', import.meta.url)),
                stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
                // utilities: path.resolve(__dirname, 'src/utilities'),
                // layout: path.resolve(__dirname, 'src/components/layouts'),
                // HTMLWrappers: path.resolve(__dirname, 'src/components/html'),
                // editor_components: path.resolve(__dirname, 'src/components'),
                // ext_types: path.resolve(__dirname, '../ext_types'),
                // stores: path.resolve('src/stores'),
            },
        },
        plugins: [
            svelte({
                configFile: path.resolve(__dirname, 'svelte.config.mjs'),
            }),
            {
                name: 'nonce',
                transformIndexHtml(html) {
                    html = html.replace(
                        /<link rel="stylesheet" crossorigin href="\/style.css">/g,
                        `<link rel="stylesheet" crossorigin href="/style.css" nonce="__nonce__"/> `
                    )

                    return html.replace(
                        /<script type="module" src="\/src\/main.ts"><\/script>/g,
                        `<script type="module" src="\/index.js" nonce="__nonce__"></script>`
                    )
                },
            },
            !debugDataEditor &&
            strip({
                include: ['**/*.svelte', '**/*.ts', '**/*.js'],
                start_comment: 'DEBUG_ONLY_START',
                end_comment: 'DEBUG_ONLY_END',
            }),
        ],
        mode: 'development',
        dev: true,
        build: {
            sourcemap: true,
            minify: false,
            cssCodeSplit: false,
            rollupOptions: {
                output: {
                    assetFileNames: (info) => {
                        const name = info.name ?? ''
                        const ext = path.extname(name).toLowerCase()
                        const base = path.basename(name, ext)
                        if (/\.(woff2?|ttf|otf|eot)$/.test(ext)) {
                            return name.includes('material-icons')
                                ? `resources/icons/${base}${ext}`
                                : `resources/fonts/${base}${ext}`
                        }
                        return `[name][extname]`
                    },
                    format: 'iife', // Immediately Invoked Function Expression for a single file
                    inlineDynamicImports: true, // Forces all dynamic imports to be included in the same file
                    entryFileNames: 'index.js', // Name of the final output file
                },
            },
            outDir: '../../dist/views/dataEditor',
        },
        server: { watch: { cwd: '.' } },
    }
})
