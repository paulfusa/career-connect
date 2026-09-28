<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Suggestion } from '$lib/suggest.svelte';
	import OrgLogo from './OrgLogo.svelte';

	// Text input with a styled suggestion list (WAI-ARIA combobox pattern).
	// The list is a popover, so it renders in the top layer above dialogs and isn't clipped by their scroll.
	let {
		value = $bindable(''),
		options,
		onpick,
		onsearch,
		onenter,
		...rest
	}: Omit<HTMLInputAttributes, 'value'> & {
		value?: string;
		options: Suggestion[];
		onpick: (option: Suggestion) => void;
		onsearch?: (text: string) => void;
		// Enter with no highlighted option; return true if handled (e.g. add a chip)
		onenter?: (text: string) => boolean;
	} = $props();

	const id = $props.id();
	let input: HTMLInputElement;
	let list: HTMLUListElement;
	let focused = $state(false);
	let dismissed = $state(false);
	let active = $state(-1);

	let open = $derived(focused && !dismissed && options.length > 0);

	// a new set of options resets the highlight
	$effect(() => {
		void options;
		active = -1;
	});

	function place() {
		const r = input.getBoundingClientRect();
		const below = window.innerHeight - r.bottom;
		const height = Math.min(list.scrollHeight, 320);
		const flip = below < height + 12 && r.top > below;
		list.style.left = `${r.left}px`;
		list.style.width = `${r.width}px`;
		list.style.top = flip ? `${r.top - height - 6}px` : `${r.bottom + 6}px`;
	}

	$effect(() => {
		if (!list) return;
		if (!open) {
			if (list.matches(':popover-open')) list.hidePopover();
			return;
		}
		void options.length;
		if (!list.matches(':popover-open')) list.showPopover();
		place();
		const update = () => place();
		window.addEventListener('scroll', update, true);
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update, true);
			window.removeEventListener('resize', update);
		};
	});

	function choose(option: Suggestion) {
		onpick(option);
		dismissed = true;
	}

	function onkeydown(e: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		rest.onkeydown?.(e);
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			if (!options.length) return;
			e.preventDefault();
			dismissed = false;
			const last = options.length - 1;
			if (e.key === 'ArrowDown') active = active >= last ? 0 : active + 1;
			else active = active <= 0 ? last : active - 1;
			list?.querySelector(`#${CSS.escape(`${id}-${active}`)}`)?.scrollIntoView({ block: 'nearest' });
		} else if (e.key === 'Enter') {
			if (open && active >= 0) {
				e.preventDefault();
				choose(options[active]);
			} else if (onenter?.(value)) {
				e.preventDefault();
			} else if (open) {
				e.preventDefault();
				dismissed = true;
			}
		} else if (e.key === 'Escape' && open) {
			// close the list, not the dialog around it
			e.preventDefault();
			e.stopPropagation();
			dismissed = true;
		}
	}
</script>

<input
	{...rest}
	bind:this={input}
	bind:value
	type="text"
	role="combobox"
	autocomplete="off"
	aria-autocomplete="list"
	aria-expanded={open}
	aria-controls="{id}-list"
	aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
	onfocus={() => (focused = true)}
	onblur={(e) => {
		focused = false;
		rest.onblur?.(e);
	}}
	oninput={() => {
		dismissed = false;
		onsearch?.(value);
	}}
	{onkeydown}
/>

<ul
	bind:this={list}
	id="{id}-list"
	popover="manual"
	role="listbox"
	class="m-0 max-h-80 overflow-y-auto rounded-2xl border border-white/70 bg-white/85 p-1.5 text-ink shadow-[0_18px_40px_-12px_rgba(27,38,56,0.3)] backdrop-blur-xl"
>
	{#each options as option, i (option.label)}
		<!-- mousedown keeps focus in the input; keyboard users pick with arrows + Enter on the input -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<li
			id="{id}-{i}"
			role="option"
			aria-selected={i === active}
			class="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 {i === active ? 'bg-tide/10' : 'hover:bg-white'}"
			onmousedown={(e) => e.preventDefault()}
			onmousemove={() => (active = i)}
			onclick={() => choose(option)}
		>
			{#if option.domain}<OrgLogo name={option.label} domain={option.domain} size="sm" />{/if}
			<span class="min-w-0">
				<span class="block truncate font-medium">{option.title ?? option.label}</span>
				{#if option.detail}<span class="block truncate text-xs text-ink/55">{option.detail}</span>{/if}
			</span>
		</li>
	{/each}
</ul>
