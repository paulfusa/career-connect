<script lang="ts">
	import { RATINGS } from '$lib/company-reviews';
	import FieldError from './FieldError.svelte';

	// US-09: 1 to 5 star picker. They're normal radio buttons underneath, so it works with forms and the keyboard
	let { value = $bindable(null), error, errorId }: { value?: number | null; error?: string; errorId: string } = $props();
</script>

<fieldset aria-describedby={errorId}>
	<legend class="text-sm font-medium">Rating</legend>
	<div class="mt-1.5 flex gap-1">
		{#each RATINGS as star (star)}
			<label class="cursor-pointer rounded-md px-0.5 text-3xl leading-none has-focus-visible:outline-2 has-focus-visible:outline-tide">
				<input type="radio" name="rating" value={star} bind:group={value} required class="sr-only" />
				<span aria-hidden="true" class={value !== null && star <= value ? 'text-amber-400' : 'text-ink/20 hover:text-amber-300'}>★</span>
				<span class="sr-only">{star} {star === 1 ? 'star' : 'stars'}</span>
			</label>
		{/each}
	</div>
	<FieldError id={errorId} message={error} />
</fieldset>
