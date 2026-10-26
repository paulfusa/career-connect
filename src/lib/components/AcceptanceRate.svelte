<script lang="ts">
	// US-05: rate is a percentage (0-100), null means no decisions yet
	let { rate }: { rate: number | null } = $props();
</script>

{#if rate === null}
	<p class="mt-2 text-ink/60"><span class="font-medium">Acceptance rate:</span> not available yet</p>
{:else}
	<p class="mt-2 text-ink/75"><span class="font-medium">Acceptance rate:</span> {rate}%</p>
{/if}
