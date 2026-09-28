<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { glassDialog } from '$lib/ui';

	// Profile section editor. Opened by a URL param (e.g. /profile?edit=about), so it can be linked
	// to and closes with the back button; closing (Esc) returns to /profile.
	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<dialog
	{@attach (d) => d.showModal()}
	onclose={() => goto('/profile', { noScroll: true, replaceState: true })}
	aria-labelledby="edit-dialog-title"
	class="{glassDialog} max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto"
>
	<h2 id="edit-dialog-title" class="font-display text-2xl font-semibold tracking-tight">{title}</h2>
	{@render children()}
</dialog>
