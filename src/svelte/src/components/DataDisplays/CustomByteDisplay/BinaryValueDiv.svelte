<script lang="ts">
  import { onMount } from 'svelte';
  import type { ByteValue } from './BinaryData';

  // export let byteValue: string;
  export let byte: ByteValue = {text: '', offset: 0, value: 0}

  let color = 'transparent';
  const setColor = () => {
    color = generateRandomColor();
  }
  function generateRandomColor() {
    return `#${Math.floor(Math.random()*16777215).toString(16)}`;
  }

  onMount(() => {
    color = generateRandomColor();
  });
</script>

<div on:focus={setColor} on:mouseover="{setColor}" style="border-color: {color};">
  {byte.text}
</div>

<style>
  div {
    display: flex;
    justify-content: center;
    flex-direction: column;
    font-family: monospace;
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    height: 30px;
    width: 30px;
    text-align: center;
  }
</style>
