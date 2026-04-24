// import { } from 'ext_types'
import { ViewportState } from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte.ts'
import type { ViewportRefreshResponse } from 'ext_types'

export const TestId = 'testvp'
export const createRefreshResponse = (
  fields: Partial<ViewportRefreshResponse>
) => {
  let ret: ViewportRefreshResponse = {
    viewportId: TestId,
    fileOffset: 0,
    length: 0,
    bytesLeft: 0,
    data: new Uint8Array(1024).fill(0),
    capacity: 1024,
  }
  for (const field of Object.keys(fields)) {
    ret[field] = fields[field]
  }
  return ret
}
