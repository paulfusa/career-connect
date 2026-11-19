<script lang="ts">
	import { RATINGS } from '$lib/company-reviews';

	// US-09: a rating as stars (3.5 shows 4)
	let { rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' } = $props();
	const filled = $derived(Math.round(rating));
</script>

<span role="img" aria-label="{rating} out of 5 stars" class="inline-flex gap-0.5 leading-none {size === 'lg' ? 'text-2xl' : 'text-base'}">
	{#each RATINGS as star (star)}
		<span aria-hidden="true" class={star <= filled ? 'text-amber-400' : 'text-ink/20'}>★</span>
	{/each}
</span>
