import { createViewport, ViewportDataResponse } from '@omega-edit/client'
class Viewport {
  constructor(readonly id: string) {}
  static Create(
    viewportResponse: Promise<ViewportDataResponse>
  ): Promise<Viewport> {
    return new Promise(async (res, rej) => {
      viewportResponse
        .catch((err) => {
          rej(err)
        })
        .then((r) => {
          const id = r!.getViewportId()
        })
    })
  }
}
const VIEWPORT_DEFAULT_CAPACITY = 1024

export const ViewportCreateHandler = async (
  subscriptionCallback: () => any,
  sessionId: string,
  offset: number = 0,
  capacity: number = VIEWPORT_DEFAULT_CAPACITY
): Promise<Viewport> => {
  return Viewport.Create(
    createViewport(undefined, sessionId, offset, capacity, false)
  )
}
