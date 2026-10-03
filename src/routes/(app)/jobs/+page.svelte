<script lang="ts">
	import { EMPLOYMENT_TYPES, WORK_MODES } from '$lib/profile-options';
	import { glassPanel, primaryButton } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Jobs · CareerConnect</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4 md:mt-14">
	<div>
		<p class="text-sm font-medium uppercase tracking-widest text-tide-deep">CareerConnect</p>
		<h1 class="mt-1 font-display text-3xl font-semibold tracking-tight">Job postings</h1>
	</div>
	{#if data.user.role === 'recruiter'}
		<a href="/jobs/new" class={primaryButton + ' w-auto px-5 text-center'}>Create a posting</a>
	{/if}
</div>

{#if data.postings.length}
	<section class="mt-6 grid gap-4">
		{#each data.postings as posting (posting.id)}
			<a href="/jobs/{posting.id}" class="{glassPanel} block p-6 transition hover:bg-white/65 focus-visible:outline-2 focus-visible:outline-tide">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h2 class="font-display text-xl font-semibold">{posting.title}</h2>
						<p class="mt-1 text-ink/70">{posting.company} <span aria-hidden="true">·</span> {posting.location}</p>
					</div>
					<div class="flex flex-wrap gap-2 text-sm text-ink/65">
						<span class="rounded-full bg-white/65 px-3 py-1">{EMPLOYMENT_TYPES[posting.employmentType as keyof typeof EMPLOYMENT_TYPES] ?? posting.employmentType}</span>
						<span class="rounded-full bg-white/65 px-3 py-1">{WORK_MODES[posting.workMode as keyof typeof WORK_MODES] ?? posting.workMode}</span>
					</div>
				</div>
				<p class="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-ink/70">{posting.description}</p>
				<p class="mt-4 text-xs text-ink/50">Posted {posting.createdAt.toLocaleDateString()}</p>
			</a>
		{/each}
	</section>
{:else}
	<section class="{glassPanel} mt-6 grid min-h-64 place-items-center p-8 text-center">
		<div>
			<h2 class="font-display text-xl font-semibold">No job postings yet</h2>
			<p class="mt-2 text-ink/60">New opportunities will appear here when recruiters post them.</p>
			{#if data.user.role === 'recruiter'}
				<a href="/jobs/new" class="mt-5 inline-block font-semibold text-tide-deep underline underline-offset-4">Create the first posting</a>
			{/if}
		</div>
	</section>
{/if}
