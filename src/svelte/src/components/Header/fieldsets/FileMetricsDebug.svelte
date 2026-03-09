<script lang="ts">
  import { getDebugVarContext } from '../../Debug/'
  import { canUndo, saveable} from './FileMetrics.svelte.ts'

  getDebugVarContext().add({
    id: 'Saveable',
    valueStr: () => {
      return saveable() ? "true" : "false"
    },
  })
getDebugVarContext().add({
    id: 'Can Undo',
    valueStr: () => {
      return canUndo() ? "true" : "false"
    },
  })

</script>

<span></span>
