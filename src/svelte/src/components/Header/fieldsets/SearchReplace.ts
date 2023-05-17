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

import { SimpleWritable } from '../../../stores/localStore'
import { addressValue, gotoOffset, gotoOffsetInput } from '../../../stores'
import { get } from 'svelte/store'

interface QueryableData {
  input: string
  processing: boolean
  isValid: boolean
}
class SearchData implements QueryableData {
  input: string = ''
  processing: boolean = false
  isValid: boolean = false
  searchIndex: number = 0
  searchResults: Array<number> = []
}
class SearchQuery extends SimpleWritable<SearchData> {
  protected store_init(): SearchData {
    return new SearchData()
  }
  public clear_results() {
    this.update((query) => {
      query.processing = false
      query.searchIndex = 0
      query.searchResults = []
      return query
    })
  }
  public update_search_results(offset?: number) {
    this.update((query) => {
      query.searchIndex = !offset
        ? Math.abs(
            (query.searchResults.length + query.searchIndex) %
              query.searchResults.length
          )
        : Math.abs(
            (query.searchResults.length + offset) % query.searchResults.length
          )

      gotoOffsetInput.update((_) => {
        return query.searchResults[query.searchIndex].toString(
          get(addressValue)
        )
      })
      gotoOffset.update(() => {
        return query.searchResults[query.searchIndex]
      })

      return query
    })
  }
}

class ReplaceData implements QueryableData {
  input: string = ''
  processing: boolean = false
  isValid: boolean = false
  count: number = 0
}
export class ReplaceQuery extends SimpleWritable<ReplaceData> {
  protected store_init(): ReplaceData {
    return new ReplaceData()
  }
}

export const searchQuery = new SearchQuery()
export const replaceQuery = new ReplaceQuery()