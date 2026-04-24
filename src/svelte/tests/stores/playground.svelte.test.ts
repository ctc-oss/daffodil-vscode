import { ViewportState } from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte.ts';
import { describe, it, expect } from 'vitest'

describe('ViewportState Runes', () => {
  describe('Public Getters', () => {
    it("should retain non-reactive values", () => {
      const vp = new ViewportState()
      vp.update(100)
      expect(vp.fileOffset() == -1)
    })
  })
})
