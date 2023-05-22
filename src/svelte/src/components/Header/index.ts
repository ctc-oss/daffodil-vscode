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

import { searchQuery, replaceQuery } from './fieldsets/SearchReplace'
import { validateEncodingStr } from '../../utilities/display'
import { ErrorStore, ErrorComponentType } from '../Error/Error'
import { editorEncoding } from '../../stores'
import { derived } from 'svelte/store'
import { selectionData } from '../Editors/DataEditor'

export const searchErr = new ErrorStore(ErrorComponentType.SYMBOL)
export const replaceErr = new ErrorStore(ErrorComponentType.SYMBOL)
export const goToErr = new ErrorStore(ErrorComponentType.SYMBOL)

export const searchable = derived(
  [searchQuery, editorEncoding],
  ([$searchQuery, $editorEncoding]) => {
    if ($searchQuery.input.length === 0 || $searchQuery.processing) {
      searchErr.update(() => {
        return ''
      })
      return false
    }
    const ret = validateEncodingStr($searchQuery.input, $editorEncoding, 'full')
    searchErr.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

export const replaceable = derived(
  [replaceQuery, editorEncoding, searchable, selectionData],
  ([$replaceData, $editorEncoding, $searchable, $selectionData]) => {
    if (
      $replaceData.input.length < 0 ||
      !$searchable ||
      $replaceData.processing
    ) {
      replaceErr.update(() => {
        return ''
      })
      return false
    }
    if ($selectionData.active) {
      replaceErr.update(() => {
        return 'Cannot replace while viewport data is selected'
      })
      return false
    }

    const ret = validateEncodingStr($replaceData.input, $editorEncoding)
    replaceErr.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)
