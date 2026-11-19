<script lang="ts">
	import { starFills } from '$lib/company-reviews';

	// US-09: a rating as stars, with half stars (3.5 shows three and a half)
	let { rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' } = $props();
	const fills = $derived(starFills(rating));
</script>

<span role="img" aria-label="{rating} out of 5 stars" class="inline-flex gap-0.5 leading-none {size === 'lg' ? 'text-2xl' : 'text-base'}">
	{#each fills as fill, i (i)}
		<!-- grey star with the yellow one on top, cut to how full it is -->
		<span aria-hidden="true" class="relative inline-block text-ink/20">★{#if fill > 0}<span class="absolute left-0 top-0 h-full overflow-hidden text-amber-400" style="width: {fill * 100}%">★</span>{/if}</span>
	{/each}
</span>
