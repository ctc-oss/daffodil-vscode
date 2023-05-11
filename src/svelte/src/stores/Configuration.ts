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

export type Radixes = 'Hexidecimal' | 'Decimal' | 'Octal' | 'Binary'
export type RadixValues = 16 | 10 | 8 | 2
export const RadixOptions: Record<Radixes, RadixValues> = {
  Hexidecimal: 16,
  Decimal: 10,
  Octal: 8,
  Binary: 2,
}

export enum EditByteModes {
  Single = 'single',
  Multiple = 'multiple',
}

export type EditorEncodings =
  | 'hex'
  | 'binary'
  | 'ascii'
  | 'latin1'
  | 'utf-8'
  | 'utf-16le'

export const encoding_groups = [
  {
    group: 'Binary',
    encodings: [
      { name: 'Hexidecimal', value: 'hex' },
      { name: 'Binary', value: 'binary' },
    ],
  },
  {
    group: 'Single-byte',
    encodings: [
      { name: 'ASCII (7-bit)', value: 'ascii' },
      { name: 'Latin-1 (8-bit)', value: 'latin1' },
    ],
  },
  {
    group: 'Multi-byte',
    encodings: [
      { name: 'UTF-8', value: 'utf-8' },
      { name: 'UTF-16LE', value: 'utf-16le' },
    ],
  },
]
export function buffer_encoding_to_local() {}
export const endiannessOpt = [
  { name: 'Big', value: 'be' },
  { name: 'Little', value: 'le' },
]

export const lsbOpt = [
  { name: 'Higher Offset', value: 'h' },
  { name: 'Lower Offset', value: 'l' },
]

export const byteSizeOpt = [{ value: 8 }, { value: 7 }, { value: 6 }]

export const addressOpt = [
  { name: 'Hexidecimal', value: 16 },
  { name: 'Decimal', value: 10 },
  { name: 'Octal', value: 8 },
]
