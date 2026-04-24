// Licensed to the Apache Software Foundation (ASF) under one or more
// contributor license agreements.  See the NOTICE file distributed with
// this work for additional information regarding copyright ownership.
// The ASF licenses this file to You under the Apache License, Version 2.0
// (the "License"); you may not use this file except in compliance with
// the License.  You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { defineConfig, mergeConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import strip from 'rollup-plugin-strip-code'
import * as fs from 'fs'
import path from 'path'
// Yarn executes from repo root
const r = (p) => fileURLToPath(new URL(p, import.meta.url))
const envFilePath = path.resolve(__dirname, '.env')
const projectRoot = r('.')

/// <reference types="vitest/config"/>
export default defineConfig(({ mode }) => {
    if (fs.existsSync(envFilePath)) loadEnvFile(envFilePath)
    const debugDataEditor =
        process.env.DEBUG_DATAEDITOR == 'on' && mode === 'development'
    return {
        root: projectRoot,
        base: "./",
        plugins: [
            svelte({ configFile: r('./svelte.config.mjs') }),
            !debugDataEditor &&
            strip({
                include: ['**/*.svelte', '**/*.ts', '**/*.js'],
                start_comment: 'DEBUG_ONLY_START',
                end_comment: 'DEBUG_ONLY_END',
            }),
        ],
        resolve: {
            tsconfigPaths: true,
            alias: {
                $root: debugDataEditor
                    ? r('./src/App.debug.svelte')
                    : r('./src/App.svelte'),
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
                ext_types: fileURLToPath(new URL('../ext_types', import.meta.url)),
                stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
            },
        },
        // test: {
        //     environment: 'jsdom',
        //     globals: true,
        //     root: fileURLToPath(new URL('.', import.meta.url)),
        //     alias: {
        //         '@': fileURLToPath(new URL('./src', import.meta.url)),
        //         utilities: fileURLToPath(new URL('./src/utilities', import.meta.url)),
        //         layout: fileURLToPath(
        //             new URL('./src/components/layouts', import.meta.url)
        //         ),
        //         HTMLWrappers: fileURLToPath(
        //             new URL('./src/components/html', import.meta.url)
        //         ),
        //         editor_components: fileURLToPath(
        //             new URL('./src/components', import.meta.url)
        //         ),
        //         ext_types: fileURLToPath(new URL('../ext_types', import.meta.url)),
        //         stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
        //     },
        //     include: [
        //         './src/svelte/**/*.svelte.test.ts',
        //         './tests/**/*.svelte.test.ts',
        //         './src/svelte/**/*.test.ts',
        //         './tests/**/*.test.ts',
        //     ],
        //     exclude: ['node_modules/**', 'out/**'],
        //     typecheck: {
        //         enabled: true,
        //         tsconfig: './tsconfig.json',
        //         include: ['./tests/**/*.svelte.test.ts', '**/*.test-d.ts'],
        //         ignoreSourceErrors: false,
        //     },
        // },
    }
})
