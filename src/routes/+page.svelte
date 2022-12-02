<script lang="ts">
    import { sx, type Reactable } from "$lib";

    let numbers: Reactable<number[]> = sx([1, 2, 3], (n) => (numbers = n));
    let value = "";
</script>

<!-- svelte-ignore a11y-autofocus -->
<input autofocus bind:value />
<button disabled={value == ""} on:click={() => numbers.push(parseInt(value, 10))}>add number</button>
<button on:click={() => numbers.reset([4, 5, 6])}>reset to [4, 5, 6]</button>

<h4>numbers:</h4>
<ul>
    {#each numbers as item, index}
        <li>
            <input type="number" bind:value={item} />
            <button on:click={() => numbers.remove(index)}>×</button>
        </li>
    {/each}
</ul>
<button on:click={() => numbers.clear()}>clean all</button>
<h4>sum = {numbers.reduce((s, c) => (s += c), 0)}</h4>
