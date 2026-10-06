<script lang="ts">
	import { filterList, Suggester, type Search } from '$lib/suggest.svelte';
	import { field } from '$lib/ui';
	import Combobox from './Combobox.svelte';

	// Multi-value picker: type, pick a suggestion or press Enter/comma to add a chip.
	// Each chip is submitted as a hidden input named `name`. With starName set, chips can be
	// starred (e.g. top skills), submitted as `starName`.
	let {
		name,
		label,
		values = [],
		options = [],
		search,
		max,
		maxLength = 100,
		placeholder = '',
		hint,
		starName,
		starred = [],
		maxStarred = 5
	}: {
		name: string;
		label: string;
		values?: string[];
		options?: string[];
		search?: Search;
		max: number;
		maxLength?: number;
		placeholder?: string;
		hint?: string;
		starName?: string;
		starred?: string[];
		maxStarred?: number;
	} = $props();

	// svelte-ignore state_referenced_locally
	let items = $state([...values]);
	// svelte-ignore state_referenced_locally
	let stars = $state([...starred]);
	let text = $state('');
	let notice = $state('');
	// svelte-ignore state_referenced_locally
	const suggester = search ? new Suggester(search) : null;

	const has = (list: string[], value: string) => list.some((v) => v.toLowerCase() === value.toLowerCase());
	// fixed lists filter instantly as you type; searches come back from the Suggester
	let suggestions = $derived(
		suggester ? suggester.options.filter((o) => !has(items, o.label)) : filterList(options, text, items)
	);

	function add(raw: string) {
		const value = raw.trim().replace(/,$/, '').trim();
		text = '';
		if (!value) return;
		if (has(items, value)) return (notice = `${value} is already added.`);
		if (value.length > maxLength) return (notice = `Keep each one under ${maxLength} characters.`);
		if (items.length >= max) return (notice = `You can add up to ${max}.`);
		// use the suggestion's spelling when the user typed a known one in another case
		const known = [...options, ...suggestions.map((o) => o.label)];
		items.push(known.find((s) => s.toLowerCase() === value.toLowerCase()) ?? value);
		notice = '';
	}

	function remove(value: string) {
		items = items.filter((v) => v !== value);
		stars = stars.filter((v) => v !== value);
		notice = '';
	}

	function toggleStar(value: string) {
		if (stars.includes(value)) stars = stars.filter((v) => v !== value);
		else if (stars.length >= maxStarred) notice = `You can star up to ${maxStarred}.`;
		else stars.push(value);
	}

	// starred first, then the rest in the order they were added
	let ordered = $derived([...items.filter((v) => stars.includes(v)), ...items.filter((v) => !stars.includes(v))]);
</script>

<div>
	<label class="text-sm font-medium" for="{name}-input">{label}</label>

	{#if ordered.length}
		<ul class="mt-2 flex flex-wrap gap-2" aria-label={label}>
			{#each ordered as item (item)}
				{@const isStar = stars.includes(item)}
				<li
					class="flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm ring-1 {isStar
						? 'bg-tide/10 ring-tide/40'
						: 'bg-white/70 ring-white'}"
				>
					{#if starName}
						<button
							type="button"
							onclick={() => toggleStar(item)}
							aria-pressed={isStar}
							aria-label="{isStar ? 'Unstar' : 'Star'} {item}"
							class="-ml-1.5 grid size-6 place-items-center rounded-full {isStar ? 'text-tide' : 'text-ink/30'} hover:bg-white"
						>
							<svg viewBox="0 0 20 20" class="size-4" fill={isStar ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<path d="M10 2.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2L10 14.4l-4.6 2.5.9-5.2-3.8-3.7 5.2-.8z" stroke-linejoin="round" />
							</svg>
						</button>
					{/if}
					<span>{item}</span>
					<button
						type="button"
						onclick={() => remove(item)}
						aria-label="Remove {item}"
						class="grid size-6 place-items-center rounded-full text-ink/50 hover:bg-white hover:text-ink"
					>
						<svg viewBox="0 0 20 20" class="size-3.5" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
						</svg>
					</button>
					<input type="hidden" {name} value={item} />
					{#if isStar && starName}<input type="hidden" name={starName} value={item} />{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<Combobox
		id="{name}-input"
		bind:value={text}
		options={suggestions}
		status={suggester?.loading ? 'Searching…' : undefined}
		{placeholder}
		aria-describedby="{name}-hint {name}-notice"
		class={field}
		onsearch={(t) => (t.endsWith(',') ? add(t) : suggester?.run(t))}
		onpick={(option) => add(option.label)}
		onenter={(t) => {
			add(t);
			return true;
		}}
		onkeydown={(e) => {
			if (e.key === 'Backspace' && !text && items.length) remove(items[items.length - 1]);
		}}
		onblur={() => add(text)}
	/>
	<span id="{name}-hint" class="mt-1.5 block text-xs text-ink/55">
		{hint ?? 'Press Enter or pick a suggestion to add.'}
		{items.length}/{max}.
	</span>
	<span id="{name}-notice" role="status" class="block text-xs text-rose-700">{notice}</span>
</div>
