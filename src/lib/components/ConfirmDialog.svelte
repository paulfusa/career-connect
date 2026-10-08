<script lang="ts">
	import type { Snippet } from 'svelte';
	import { glassDialog, secondaryButton } from '$lib/ui';

	// Small glass confirmation dialog. Render it conditionally; it opens when mounted.
	// `children` is the confirming control (usually a form with the destructive button).
	let {
		title,
		message,
		oncancel,
		children
	}: { title: string; message: string; oncancel: () => void; children: Snippet } = $props();

	let dialog: HTMLDialogElement;
</script>

<dialog
	bind:this={dialog}
	{@attach (d) => d.showModal()}
	onclose={oncancel}
	aria-labelledby="confirm-title"
	aria-describedby="confirm-message"
	class="{glassDialog} max-w-sm"
>
	<h2 id="confirm-title" class="font-display text-xl font-semibold tracking-tight">{title}</h2>
	<p id="confirm-message" class="mt-2 text-ink/70">{message}</p>
	<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
		<!-- Cancel is first in the DOM, so it gets focus when the dialog opens -->
		<button type="button" class={secondaryButton} onclick={() => dialog.close()}>Cancel</button>
		{@render children()}
	</div>
</dialog>
