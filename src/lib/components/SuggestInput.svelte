<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Suggester, type Search } from '$lib/suggest.svelte';
	import Combobox from './Combobox.svelte';

	// A text input with live suggestions. Any other attribute is passed through to the input.
	// With domainName set, a hidden input carries the picked suggestion's domain (used for logos).
	let {
		name,
		search,
		fixed = [],
		value = '',
		domainName,
		domain = null,
		...rest
	}: Omit<HTMLInputAttributes, 'value'> & {
		name: string;
		search: Search;
		fixed?: string[];
		value?: string | null;
		domainName?: string;
		domain?: string | null;
	} = $props();

	// svelte-ignore state_referenced_locally
	const initial = { value: value ?? '', domain };
	// svelte-ignore state_referenced_locally
	const suggester = new Suggester(search, fixed.map((label) => ({ label })));
	let current = $state(initial.value);

	// keep the stored domain while the text is unchanged; typed-over text loses it
	let pickedDomain = $derived(
		suggester.find(current)?.domain ?? (current === initial.value ? initial.domain : null) ?? ''
	);
</script>

<Combobox
	{...rest}
	{name}
	bind:value={current}
	options={suggester.options.filter((o) => o.label !== current)}
	onsearch={(text) => suggester.run(text)}
	onpick={(option) => (current = option.label)}
/>
{#if domainName}
	<input type="hidden" name={domainName} value={pickedDomain} />
{/if}
