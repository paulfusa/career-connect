<script lang="ts">
	import { RATINGS, starFills } from '$lib/company-reviews';
	import FieldError from './FieldError.svelte';

	// US-09: a 0 button, then two radios per star, one for each half (arrow keys work too).
	// The radios are see-through and sit right on top, so the "pick one" bubble points at the stars
	let { value = $bindable(null), error, errorId }: { value?: number | null; error?: string; errorId: string } = $props();
	const fills = $derived(starFills(value ?? 0));
	const radio = 'absolute inset-0 size-full cursor-pointer appearance-none opacity-0';
</script>

<fieldset aria-describedby={errorId}>
	<legend class="text-sm font-medium">Rating</legend>
	<div class="mt-1.5 flex items-center gap-1">
		<label
			class="relative mr-1 grid size-8 place-items-center rounded-full border border-white/70 bg-white/50 text-sm font-semibold text-ink/60
				has-checked:border-tide has-checked:bg-tide/10 has-checked:text-tide-deep has-focus-visible:outline-2 has-focus-visible:outline-tide
				dark:border-white/15 dark:bg-[#242427] dark:has-checked:text-[#7dd3df]"
		>
			0
			<input type="radio" name="rating" value={0} bind:group={value} required aria-label="0 stars" class={radio} />
		</label>
		{#each RATINGS as star, i (star)}
			<span class="relative inline-block text-3xl leading-none">
				<span aria-hidden="true" class="text-ink/20">★</span>
				{#if fills[i] > 0}
					<span aria-hidden="true" class="absolute left-0 top-0 h-full overflow-hidden text-amber-400" style="width: {fills[i] * 100}%">★</span>
				{/if}
				{#each [star - 0.5, star] as half (half)}
					<label class="absolute top-0 h-full w-1/2 rounded-sm has-focus-visible:outline-2 has-focus-visible:outline-tide {half < star ? 'left-0' : 'right-0'}">
						<input type="radio" name="rating" value={half} bind:group={value} required aria-label="{half} {half === 1 ? 'star' : 'stars'}" class={radio} />
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
