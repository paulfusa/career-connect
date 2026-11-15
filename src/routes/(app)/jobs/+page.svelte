<script lang="ts">
	import OrgLogo from '$lib/components/OrgLogo.svelte';
	import ProfileAvatarLink from '$lib/components/ProfileAvatarLink.svelte';
	import SuggestInput from '$lib/components/SuggestInput.svelte';
	import { searchCities, searchCompanies } from '$lib/suggest.svelte';
	import { EMPLOYMENT_TYPES, JOB_SORTS, POSTED_WITHIN, WORK_MODES } from '$lib/profile-options';
	import { field, glassPanel, label, primaryButton } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let searching = $derived(Object.values(data.search).some((value) => value !== ''));
</script>

<svelte:head><title>Jobs · CareerConnect</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4 md:mt-14">
	<div>
		<p class="text-sm font-medium uppercase tracking-widest text-tide-deep dark:text-tide">CareerConnect</p>
		<h1 class="mt-1 font-display text-3xl font-semibold tracking-tight">{data.mine ? 'Your job postings' : 'Job postings'}</h1>
	</div>
	{#if data.user.role === 'recruiter'}
		<a href="/jobs/new" class={primaryButton + ' px-5 text-center sm:w-auto'}>Create a posting</a>
	{/if}
</div>

{#if data.user.role === 'recruiter'}
	<nav class="mt-5 inline-flex gap-1 rounded-2xl bg-white/45 p-1 ring-1 ring-white/60 dark:bg-[#242427] dark:ring-white/10">
		{#each [
			{ href: '/jobs', label: 'All postings', current: !data.mine },
			{ href: '/jobs?mine', label: 'Active postings', current: data.mine && !data.archivedView },
			{ href: '/jobs?mine&archived=1', label: 'Archived postings', current: data.archivedView }
		] as tab (tab.href)}
			<a
				href={tab.href}
				aria-current={tab.current ? 'page' : undefined}
				class="rounded-xl px-4 py-2 text-sm font-medium text-ink/65 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-tide aria-[current=page]:bg-white/85 aria-[current=page]:text-ink aria-[current=page]:shadow-sm dark:aria-[current=page]:bg-[#444448] dark:aria-[current=page]:text-white"
			>
				{tab.label}
			</a>
		{/each}
	</nav>
{/if}

<form method="get" class="{glassPanel} mt-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
	
	{#if data.mine}
		<input type="hidden" name="mine" />
		{#if data.archivedView}<input type="hidden" name="archived" value="1" />{/if}
	{/if}

	<label class="block">
		<span class={label}>Keyword</span>
		<input name="keyword" value={data.search.keyword} placeholder="Job title or description" class={field} />
	</label>

	<!-- US-28: same suggestions as the posting form. {#key} resets the box when the search changes, so Clear search empties it -->
	<label class="block">
		<span class={label}>Company</span>
		{#key data.search.company}
			<SuggestInput name="company" search={searchCompanies} value={data.search.company} placeholder="e.g. Shopify" class={field} />
		{/key}
	</label>

	<label class="block">
		<span class={label}>Location</span>
		{#key data.search.location}
			<SuggestInput name="location" search={searchCities} fixed={['Remote']} value={data.search.location} placeholder="City or Remote" class={field} />
		{/key}
	</label>

	<!-- the value is set on the select, not on each option, so Clear search puts it back to Any -->
	<label class="block">
		<span class={label}>Employment type</span>
		<select name="employmentType" value={data.search.employmentType} class={field}>
			<option value="">Any type</option>
			{#each Object.entries(EMPLOYMENT_TYPES) as [value, text] (value)}
				<option {value}>{text}</option>
			{/each}
		</select>
	</label>

	<label class="block">
		<span class={label}>Work mode</span>
		<select name="workMode" value={data.search.workMode} class={field}>
			<option value="">Any work mode</option>
			{#each Object.entries(WORK_MODES) as [value, text] (value)}
				<option {value}>{text}</option>
			{/each}
		</select>
	</label>

	<label class="block">
		<span class={label}>Minimum salary</span>
		<input name="minSalary" type="number" min="0" step="1000" value={data.search.minSalary} placeholder="e.g. 50000" class={field} />
	</label>

	<label class="block">
		<span class={label}>Date posted</span>
		<select name="postedWithin" value={data.search.postedWithin} class={field}>
			<option value="">Any time</option>
			{#each Object.entries(POSTED_WITHIN) as [value, text] (value)}
				<option {value}>{text}</option>
			{/each}
		</select>
	</label>

	<label class="block">
		<span class={label}>Sort by</span>
		<select name="sort" value={data.search.sort} class={field}>
			<option value="">Newest first</option>
			{#each Object.entries(JOB_SORTS) as [value, text] (value)}
				<option {value}>{text}</option>
			{/each}
		</select>
	</label>

	<label class="flex items-center gap-2.5 self-end pb-3">
		<input type="checkbox" name="openOnly" checked={data.search.openOnly === 'on'} class="size-5 rounded border-white text-tide focus:ring-tide/30" />
		<span class="text-sm font-medium">Open jobs only</span>
	</label>

	<!-- US-19: only job seekers follow recruiters, so only they get this filter -->
	{#if data.user.role === 'job_seeker'}
		<label class="flex items-center gap-2.5 self-end pb-3">
			<input type="checkbox" name="following" checked={data.search.following === 'on'} class="size-5 rounded border-white text-tide focus:ring-tide/30" />
			<span class="text-sm font-medium">From people I follow</span>
		</label>
	{/if}

	<div class="flex items-end">
		<button type="submit" class={primaryButton}>Search</button>
	</div>
</form>

{#if data.postings.length}
	<section class="mt-6 grid gap-4">
		{#each data.postings as posting (posting.id)}
			<!-- the title link stretches over the whole card (after:inset-0); Edit sits above it -->
			<article class="{glassPanel} relative p-6 transition hover:bg-white/65 dark:hover:bg-[#242427] has-[h2_a:focus-visible]:outline-2 has-[h2_a:focus-visible]:outline-tide">
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

				<div class="flex flex-wrap items-center gap-2 text-sm text-ink/65">
					<span
						class="rounded-full bg-white/65 px-3 py-1
							dark:bg-white/10 dark:text-[#d4d4d8]"
					>
						{EMPLOYMENT_TYPES[posting.employmentType as keyof typeof EMPLOYMENT_TYPES] ?? posting.employmentType}
					</span>

					<span
						class="rounded-full bg-white/65 px-3 py-1
							dark:bg-white/10 dark:text-[#d4d4d8]"
					>
						{WORK_MODES[posting.workMode as keyof typeof WORK_MODES] ?? posting.workMode}
					</span>
					{#if posting.archived}
						<span class="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">Archived</span>
					{:else if !posting.closed}
						<span class="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Open</span>
					{:else}
						<span class="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">Closed</span>
					{/if}
					{#if !posting.published}
						<span class="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">Draft</span>
					{/if}
					<!-- US-19: the recruiter's photo, click it to open their profile -->
					{#if data.user.role === 'job_seeker'}
						<ProfileAvatarLink id={posting.createdBy} name={posting.creatorName} image={posting.creatorImage} />
					{/if}
					</div>
				</div>
				<p class="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-ink/70">{posting.description}</p>
				<div class="mt-4 flex items-center justify-between gap-3">
					<p class="text-xs text-ink/50">Posted {posting.createdAt.toLocaleDateString()}</p>
					{#if posting.createdBy === data.user.id}
						<div class="relative z-10 flex flex-wrap gap-2">
							<a
								href="/jobs/{posting.id}/edit"
								aria-label="Edit {posting.title}"
								class="rounded-lg border border-white/70 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-tide-deep transition hover:bg-white focus-visible:outline-2 focus-visible:outline-tide dark:border-white/15 dark:bg-[#303034] dark:text-[#7dd3df] dark:hover:bg-[#404044]"
							>
								Edit
							</a>
							<form method="POST" action={posting.archived ? '?/unarchive' : '?/archive'}>
								<input type="hidden" name="id" value={posting.id} />
								<button
									type="submit"
									class="rounded-lg border border-white/70 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-tide-deep transition hover:bg-white focus-visible:outline-2 focus-visible:outline-tide dark:border-white/15 dark:bg-[#303034] dark:text-[#7dd3df] dark:hover:bg-[#404044]"
								>
									{posting.archived ? 'Unarchive' : 'Archive'}
								</button>
							</form>
						</div>
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
				<a href={data.archivedView ? '/jobs?mine&archived=1' : data.mine ? '/jobs?mine' : '/jobs'} class="mt-5 inline-block font-semibold text-tide-deep dark:text-tide underline underline-offset-4">Clear search</a>
			{:else if data.mine}
				{#if data.archivedView}
					<h2 class="font-display text-xl font-semibold">No archived postings</h2>
					<p class="mt-2 text-ink/60">Postings you archive will be listed here.</p>
					<a href="/jobs?mine" class="mt-5 inline-block font-semibold text-tide-deep dark:text-tide underline underline-offset-4">View active postings</a>
				{:else}
					<h2 class="font-display text-xl font-semibold">You haven’t posted any active jobs</h2>
					<p class="mt-2 text-ink/60">Active postings you create will be listed here.</p>
					<a href="/jobs/new" class="mt-5 inline-block font-semibold text-tide-deep dark:text-tide underline underline-offset-4">Create your first posting</a>
				{/if}
			{:else}
				<h2 class="font-display text-xl font-semibold">No job postings yet</h2>
				<p class="mt-2 text-ink/60">New opportunities will appear here when recruiters post them.</p>
				{#if data.user.role === 'recruiter'}
					<a href="/jobs/new" class="mt-5 inline-block font-semibold text-tide-deep dark:text-tide underline underline-offset-4">Create the first posting</a>
				{/if}
			{/if}
		</div>
	</section>
{/if}
