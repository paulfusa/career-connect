<script lang="ts">
	import { glassPanel } from '$lib/ui';

	let {
		status,
		message,
		nextSteps,
		sentAt
	}: {
		status: string;
		message: string;
		nextSteps: string;
		sentAt: Date;
	} = $props();

	// date and time in Eastern time, e.g. 'Oct 22, 2026, 3:45 p.m. ET'; the zone is set so the server and the browser show the same time
	const formatDateTime = (value: Date) =>
		`${value.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto' })} ET`;
</script>

<section class="{glassPanel} p-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		{#if status === 'offered'}
			<span class="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">Offered</span>
		{:else}
			<span class="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-800">Rejected</span>
		{/if}
		<p class="text-xs text-ink/50">Sent {formatDateTime(sentAt)}</p>
	</div>

	<section class="mt-6 border-t border-white/60 pt-6">
		<h2 class="font-display text-xl font-semibold">Reasons for the decision</h2>
		<p class="mt-3 whitespace-pre-line leading-7 text-ink/75">{message}</p>
	</section>

	{#if nextSteps}
		<section class="mt-6 border-t border-white/60 pt-6">
			<h2 class="font-display text-xl font-semibold">Next steps</h2>
			<p class="mt-3 whitespace-pre-line leading-7 text-ink/75">{nextSteps}</p>
		</section>
	{/if}
</section>
