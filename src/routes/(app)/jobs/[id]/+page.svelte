<script lang="ts">
	import { page } from '$app/state';
	import OrgLogo from '$lib/components/OrgLogo.svelte';
	import { EMPLOYMENT_TYPES, WORK_MODES } from '$lib/profile-options';
	import { glassPanel, primaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let posting = $derived(data.posting);
</script>

<svelte:head><title>{posting.title} · CareerConnect</title></svelte:head>

<div class="md:mt-14">
	<a href="/jobs" class="text-sm font-medium text-tide-deep hover:underline">← All job postings</a>
	{#if page.url.searchParams.has('saved')}
		<p role="status" class="{successBox} mt-4">Job posting updated.</p>
	{/if}

	<article class="{glassPanel} mt-5 p-6 sm:p-9">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex min-w-0 items-start gap-4">
				<OrgLogo name={posting.company} domain={posting.companyDomain} />
				<div class="min-w-0">
					<p class="text-sm font-medium uppercase tracking-widest text-tide-deep">{posting.company}</p>
					<h1 class="mt-2 font-display text-3xl font-semibold tracking-tight">{posting.title}</h1>
					<p class="mt-2 text-ink/65">{posting.location} <span aria-hidden="true">·</span> Posted by {data.creatorName}</p>
				</div>
			</div>
			{#if data.isOwner}
				<a href="/jobs/{posting.id}/edit" class={primaryButton + ' px-5 text-center sm:w-auto'}>Edit posting</a>
			{/if}
		</div>

		<div class="mt-5 flex flex-wrap gap-2 text-sm">
			<span class="rounded-full bg-white/65 px-3 py-1">{EMPLOYMENT_TYPES[posting.employmentType as keyof typeof EMPLOYMENT_TYPES] ?? posting.employmentType}</span>
			<span class="rounded-full bg-white/65 px-3 py-1">{WORK_MODES[posting.workMode as keyof typeof WORK_MODES] ?? posting.workMode}</span>
		</div>

		<section class="mt-8 border-t border-white/60 pt-6">
			<h2 class="font-display text-xl font-semibold">About the role</h2>
			<p class="mt-3 whitespace-pre-line leading-7 text-ink/75">{posting.description}</p>
		</section>
		<p class="mt-8 text-xs text-ink/50">Posted {posting.createdAt.toLocaleDateString()}</p>
	</article>
</div>
