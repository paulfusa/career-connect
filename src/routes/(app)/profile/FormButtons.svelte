<script lang="ts">
	import { primaryButton, secondaryButton } from '$lib/ui';

	// Save / Cancel row for the profile edit dialogs, with an optional Delete for list entries
	let { pending, deleteAction }: { pending: boolean; deleteAction?: string } = $props();
</script>

<div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center">
	{#if deleteAction}
		<button
			formaction={deleteAction}
			formnovalidate
			disabled={pending}
			onclick={(e) => {
				if (!confirm('Delete this entry? This can’t be undone.')) e.preventDefault();
			}}
			class="rounded-xl px-4 py-2.5 font-semibold text-rose-700 transition hover:bg-rose-50/80 focus-visible:outline-2 focus-visible:outline-rose-600 sm:mr-auto"
		>
			Delete
		</button>
	{/if}
	<a href="/profile" class="{secondaryButton} text-center {deleteAction ? '' : 'sm:ml-auto'}">Cancel</a>
	<button type="submit" disabled={pending} class="{primaryButton} sm:w-auto sm:px-6">
		{pending ? 'Saving…' : 'Save'}
	</button>
</div>
