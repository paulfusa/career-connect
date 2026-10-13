<script lang="ts">
	import OrgLogo from '$lib/components/OrgLogo.svelte';
	import { EMPLOYMENT_TYPES, WORK_MODES } from '$lib/profile-options';
	import { field, glassPanel, label, primaryButton } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let searching = $derived(Object.values(data.search).some((value) => value !== ''));
</script>

<svelte:head><title>Jobs · CareerConnect</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4 md:mt-14">
	<div>
		<p class="text-sm font-medium uppercase tracking-widest text-tide-deep">CareerConnect</p>
		<h1 class="mt-1 font-display text-3xl font-semibold tracking-tight">{data.mine ? 'Your job postings' : 'Job postings'}</h1>
	</div>
	{#if data.user.role === 'recruiter'}
		<a href="/jobs/new" class={primaryButton + ' px-5 text-center sm:w-auto'}>Create a posting</a>
	{/if}
</div>

{#if data.user.role === 'recruiter'}
	<nav class="mt-5 inline-flex gap-1 rounded-2xl bg-white/45 p-1 ring-1 ring-white/60" aria-label="Which postings to show">
		{#each [{ href: '/jobs', label: 'All postings', current: !data.mine }, { href: '/jobs?mine', label: 'Your postings', current: data.mine }] as tab (tab.href)}
			<a
				href={tab.href}
				aria-current={tab.current ? 'page' : undefined}
				class="rounded-xl px-4 py-2 text-sm font-medium text-ink/65 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-tide aria-[current=page]:bg-white/85 aria-[current=page]:text-ink aria-[current=page]:shadow-sm"
			>
				{tab.label}
			</a>
		{/each}
	</nav>
{/if}

<form method="get" class="{glassPanel} mt-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
	
	{#if data.mine}
		<input type="hidden" name="mine" />
	{/if}

	<label class="block">
		<span class={label}>Keyword</span>
		<input name="keyword" value={data.search.keyword} placeholder="Job title or description" class={field} />
	</label>

	<label class="block">
		<span class={label}>Company</span>
		<input name="company" value={data.search.company} placeholder="e.g. Shopify" class={field} />
	</label>

	<label class="block">
		<span class={label}>Location</span>
		<input name="location" value={data.search.location} placeholder="City or Remote" class={field} />
	</label>

	<label class="block">
		<span class={label}>Employment type</span>
		<select name="employmentType" class={field}>
			<option value="">Any type</option>
			{#each Object.entries(EMPLOYMENT_TYPES) as [value, text] (value)}
				<option {value} selected={data.search.employmentType === value}>{text}</option>
			{/each}
		</select>
	</label>

	<label class="block">
		<span class={label}>Work mode</span>
		<select name="workMode" class={field}>
			<option value="">Any work mode</option>
			{#each Object.entries(WORK_MODES) as [value, text] (value)}
				<option {value} selected={data.search.workMode === value}>{text}</option>
			{/each}
		</select>
	</label>

	<div class="flex items-end">
		<button type="submit" class={primaryButton}>Search</button>
	</div>
</form>

{#if data.postings.length}
	<section class="mt-6 grid gap-4">
		{#each data.postings as posting (posting.id)}
			<!-- the title link stretches over the whole card (after:inset-0); Edit sits above it -->
			<article class="{glassPanel} relative p-6 transition hover:bg-white/65 has-[h2_a:focus-visible]:outline-2 has-[h2_a:focus-visible]:outline-tide">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="flex min-w-0 items-start gap-4">
						<OrgLogo name={posting.company} domain={posting.companyDomain} />
						<div class="min-w-0">
							<h2 class="font-display text-xl font-semibold">
								<a href="/jobs/{posting.id}" class="outline-none after:absolute after:inset-0 after:rounded-[28px]">{posting.title}</a>
							</h2>
							<p class="mt-1 text-ink/70">{posting.company} <span aria-hidden="true">·</span> {posting.location}</p>
						</div>
					</div>
					<div class="flex flex-wrap gap-2 text-sm text-ink/65">
						<span class="rounded-full bg-white/65 px-3 py-1">{EMPLOYMENT_TYPES[posting.employmentType as keyof typeof EMPLOYMENT_TYPES] ?? posting.employmentType}</span>
						<span class="rounded-full bg-white/65 px-3 py-1">{WORK_MODES[posting.workMode as keyof typeof WORK_MODES] ?? posting.workMode}</span>
					{#if posting.status === 'open'}
						<span class="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">Open</span>
					{:else}
						<span class="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-800">Closed</span>
					{/if}
					{#if !posting.published}
						<span class="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">Draft</span>
					{/if}
					</div>
				</div>
				<p class="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-ink/70">{posting.description}</p>
				<div class="mt-4 flex items-center justify-between gap-3">
					<p class="text-xs text-ink/50">Posted {posting.createdAt.toLocaleDateString()}</p>
					{#if posting.createdBy === data.user.id}
						<a href="/jobs/{posting.id}/edit" aria-label="Edit {posting.title}" class="relative z-10 rounded-lg border border-white/70 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-tide-deep transition hover:bg-white focus-visible:outline-2 focus-visible:outline-tide">Edit</a>
					{/if}
				</div>
			</article>
		{/each}
	</section>
{:else}
	<section class="{glassPanel} mt-6 grid min-h-64 place-items-center p-8 text-center">
		<div>
			{#if searching}
				<h2 class="font-display text-xl font-semibold">No jobs match your search</h2>
				<p class="mt-2 text-ink/60">Try different words or fewer filters.</p>
				<a href={data.mine ? '/jobs?mine' : '/jobs'} class="mt-5 inline-block font-semibold text-tide-deep underline underline-offset-4">Clear search</a>
			{:else if data.mine}
				<h2 class="font-display text-xl font-semibold">You haven’t posted any jobs yet</h2>
				<p class="mt-2 text-ink/60">Postings you create will be listed here.</p>
				<a href="/jobs/new" class="mt-5 inline-block font-semibold text-tide-deep underline underline-offset-4">Create your first posting</a>
			{:else}
				<h2 class="font-display text-xl font-semibold">No job postings yet</h2>
				<p class="mt-2 text-ink/60">New opportunities will appear here when recruiters post them.</p>
				{#if data.user.role === 'recruiter'}
					<a href="/jobs/new" class="mt-5 inline-block font-semibold text-tide-deep underline underline-offset-4">Create the first posting</a>
				{/if}
			{/if}
		</div>
	</section>
{/if}
