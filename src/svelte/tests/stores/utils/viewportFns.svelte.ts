// import { } from 'ext_types'
import {
  ViewportState,
  type ViewportAttributes,
} from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte.ts'
import type { ViewportRefreshResponse } from 'ext_types'
import type { ReactiveLogger } from './reactiveLogger.svelte'

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

export class F_ViewportStateTest extends ViewportState {
  constructor() {
    super('testvp')
  }

  attachReactiveLogger(log: ReactiveLogger): () => void {
    let previous: ViewportAttributes | undefined

    return $effect.root(() => {
      $effect(() => {
        const values: ViewportAttributes = {
          capacity: this.capacity,
          bytesLeft: this.bytesLeft,
          data: this.data,
          fileOffset: this.fileOffset,
          length: this.length,
          offsetMax: this.offsetMax,
        }

        const changed =
          previous === undefined
            ? Object.keys(values)
            : Object.keys(values).filter(
                (key) =>
                  !Object.is(
                    previous?.[key as keyof ViewportAttributes],
                    values[key as keyof ViewportAttributes]
                  )
              )

        log({
          phase: 'run',
          changed,
          values,
        })

        previous = values

        return () => {
          log({
            phase: 'cleanup',
            changed,
            values,
          })
        }
      })
    })
  }
}
