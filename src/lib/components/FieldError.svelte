<script lang="ts">
	// Inline validation message; pair the input with aria-describedby="{id}"
	let { id, message }: { id: string; message?: string } = $props();
</script>

{#if message}
	<span {id} class="mt-1.5 block text-sm text-rose-700">{message}</span>
{/if}
