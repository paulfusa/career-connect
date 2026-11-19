<script lang="ts">
	import { RATINGS, starFills } from '$lib/company-reviews';
	import FieldError from './FieldError.svelte';

	// US-09: each star has two radio buttons on top of it, the left half and the right half.
	// They're real radios, so it works with forms and the arrow keys
	let { value = $bindable(null), error, errorId }: { value?: number | null; error?: string; errorId: string } = $props();
	const fills = $derived(starFills(value ?? 0));
</script>

<fieldset aria-describedby={errorId}>
	<legend class="text-sm font-medium">Rating</legend>
	<div class="mt-1.5 flex items-center gap-1">
		{#each RATINGS as star, i (star)}
			<span class="relative inline-block text-3xl leading-none">
				<span aria-hidden="true" class="text-ink/20">★</span>
				{#if fills[i] > 0}
					<span aria-hidden="true" class="absolute left-0 top-0 h-full overflow-hidden text-amber-400" style="width: {fills[i] * 100}%">★</span>
				{/if}
				{#each [star - 0.5, star] as half (half)}
					<label class="absolute top-0 h-full w-1/2 cursor-pointer rounded-sm has-focus-visible:outline-2 has-focus-visible:outline-tide {half < star ? 'left-0' : 'right-0'}">
						<input type="radio" name="rating" value={half} bind:group={value} required class="sr-only" />
						<span class="sr-only">{half} {half === 1 ? 'star' : 'stars'}</span>
					</label>
				{/each}
			</span>
		{/each}
		{#if value !== null}
			<span class="ml-2 text-sm text-ink/65">{value} out of 5</span>
		{/if}
	</div>
	<FieldError id={errorId} message={error} />
</fieldset>
