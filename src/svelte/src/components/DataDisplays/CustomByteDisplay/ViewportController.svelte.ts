import { SvelteMap } from "svelte/reactivity";
import type { ViewportState } from "./ViewportState.svelte";
import { } from 'svelte'

export class ViewportController {
    #controlledViewports = new SvelteMap<string, ViewportState>()
    add(viewport: ViewportState) {
        this.#controlledViewports.set(viewport.viewportId, viewport)
    }
    find(id: string) {
        let vp = this.#controlledViewports.get(id)

    }
}
