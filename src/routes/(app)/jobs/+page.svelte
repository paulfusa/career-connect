<script lang="ts">
	import SectionTabs from '$lib/components/SectionTabs.svelte';
	import OrgLogo from '$lib/components/OrgLogo.svelte';
	import ProfileAvatarLink from '$lib/components/ProfileAvatarLink.svelte';
	import Stars from '$lib/components/Stars.svelte';
	import SuggestInput from '$lib/components/SuggestInput.svelte';
	import { searchCities, searchCompanies } from '$lib/suggest.svelte';
	import { EMPLOYMENT_TYPES, JOB_SORTS, POSTED_WITHIN, WORK_MODES } from '$lib/profile-options';
	import { field, glassPanel, label, primaryButton } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let searching = $derived(Object.values(data.search).some((value) => value !== ''));
	let filtersOpen = $state(false);
	let activeFilterCount = $derived(
		[
			data.search.company,
			data.search.location,
			data.search.employmentType,
			data.search.workMode,
			data.search.minSalary,
			data.search.postedWithin,
			data.search.openOnly === 'on' ? 'on' : '',
			data.user.role === 'job_seeker' && data.search.following === 'on'
				? 'on'
				: ''
		].filter(Boolean).length
	);
	let recruiterFilterLabel = $derived(
		data.appStatus === 'all'
			? 'Postings with applications'
			: data.appStatus === 'applied'
				? 'Applications awaiting review'
				: data.appStatus === 'interview'
					? 'Interview-stage applications'
					: null
	);

	let activePostingFilterLabel = $derived(
		data.activeOnly ? 'Active job postings' : null
	);
</script>

<svelte:head><title>Jobs · CareerConnect</title></svelte:head>

<SectionTabs section="jobs" />

<div class="flex flex-wrap items-end justify-between gap-4">
	<div>
		<p class="text-sm font-medium uppercase tracking-widest text-tide-deep dark:text-tide">CareerConnect</p>
		<h1 class="mt-1 font-display text-3xl font-semibold tracking-tight">{data.mine ? 'Your job postings' : 'Job postings'}</h1>
	</div>
	{#if data.user.role === 'recruiter'}
		<a href="/jobs/new" class={primaryButton + ' px-5 text-center sm:w-auto'}>Create a posting</a>
	{/if}
</div>

<form method="get" class="{glassPanel} mt-6 space-y-4 p-4 sm:p-5">

	{#if data.mine}
		<input type="hidden" name="mine" />
		{#if data.archivedView}<input type="hidden" name="archived" value="1" />{/if}
	{/if}

	{#if data.appStatus}
		<input type="hidden" name="appStatus" value={data.appStatus} />
	{/if}

	{#if data.activeOnly}
		<input type="hidden" name="activeOnly" value="1" />
	{/if}

	<div class="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end">
		<label class="min-w-0 flex-1">
			<span class={label}>Find a job</span>
			<input
				name="keyword"
				value={data.search.keyword}
				placeholder="Job title, keyword or description..."
				class={field}
			/>
		</label>

		<div class="flex w-full shrink-0 gap-2 xl:w-auto">
			<button
				type="submit"
				class={primaryButton + ' min-w-0 flex-1 justify-center xl:flex-none'}
			>
				Search
			</button>

			<button
				type="button"
				aria-expanded={filtersOpen}
				aria-controls="advanced-job-filters"
				onclick={() => (filtersOpen = !filtersOpen)}
				class="flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-tide dark:border-white/15 dark:hover:bg-white/10 xl:flex-none"
			>
				<svg
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d="M4 7h16M7 12h10M10 17h4" />
				</svg>
				{filtersOpen ? 'Hide Filters' : 'More Filters'}
				{#if activeFilterCount > 0}
					<span
						class="inline-flex min-w-5 items-center justify-center rounded-full bg-tide px-1.5 py-0.5 text-xs font-bold text-white"
					>
						{activeFilterCount}
					</span>
				{/if}
			</button>
		</div>
		{#if searching}
			<a
				href={data.mine
					? `/jobs?mine${data.archivedView ? '&archived=1' : ''}${data.appStatus ? `&appStatus=${data.appStatus}` : ''}`
					: '/jobs'}
				class="self-center text-sm font-semibold text-tide-deep underline underline-offset-4 hover:text-tide dark:text-tide"
			>
				Clear Filters
			</a>
		{/if}
	</div>

<div
	id="advanced-job-filters"
	class={filtersOpen ? 'block' : 'hidden'}
>
	<div class="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2 lg:grid-cols-3">
		<label class="block">
			<span class={label}>Company</span>
			{#key data.search.company}
				<SuggestInput
					name="company"
					search={searchCompanies}
					value={data.search.company}
					placeholder="e.g. Shopify"
					class={field}
				/>
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
	<div class="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
		<button
			type="submit"
			class={primaryButton + ' inline-flex min-w-max items-center justify-center whitespace-nowrap px-5 py-3'}
		>
			Apply Filters
		</button>

		{#if activeFilterCount > 0}
			<span class="text-sm text-ink/60">
				{activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
			</span>
		{/if}
	</div>

	</div>
</div>
</form>

{#if recruiterFilterLabel || activePostingFilterLabel}
	<div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tide/20 bg-tide/5 px-4 py-3">
		<p class="text-sm font-medium text-ink">
			Showing:
			<span class="font-semibold text-tide-deep dark:text-tide">
				{activePostingFilterLabel ?? recruiterFilterLabel}
			</span>
		</p>

		<a
			href={data.archivedView ? '/jobs?mine&archived=1' : '/jobs?mine'}
			class="text-sm font-semibold text-tide-deep underline underline-offset-4 dark:text-tide"
		>
			Show All Postings
		</a>
	</div>
{/if}

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
							<!-- US-09: only shows once the company has reviews -->
							{#if posting.rating}
								<p class="mt-1 flex items-center gap-1.5 text-sm text-ink/65">
									<Stars rating={posting.rating.average} />
									{posting.rating.average.toFixed(1)} · {posting.rating.count} {posting.rating.count === 1 ? 'review' : 'reviews'}
								</p>
							{/if}
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
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
						<p class="text-xs text-ink/50">Posted {posting.createdAt.toLocaleDateString()}</p>
						{#if data.mine}
							<p class="text-xs font-medium text-ink/60">
								{posting.applicationCount ?? 0} {(posting.applicationCount ?? 0) === 1 ? 'application' : 'applications'}
							</p>
						{/if}
					</div>
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

				{#if (recruiterFilterLabel || activePostingFilterLabel) && !searching}
					<h2 class="font-display text-xl font-semibold">
						No matching job postings
					</h2>
					<p class="mt-2 text-ink/60">
						No postings currently match "{activePostingFilterLabel ?? recruiterFilterLabel}".
					</p>
					<a
						href="/jobs?mine"
						class="mt-5 inline-block font-semibold text-tide-deep underline underline-offset-4 dark:text-tide"
					>
						Show All Postings
					</a>
					{:else if searching}
						<h2 class="font-display text-xl font-semibold">
							No jobs match your search
						</h2>
						<p class="mt-2 text-ink/60">
							Try different words or fewer filters.
						</p>
						<a
							href={data.mine
								? `/jobs?mine${data.archivedView ? '&archived=1' : ''}${data.appStatus ? `&appStatus=${data.appStatus}` : ''}${data.activeOnly ? '&activeOnly=1' : ''}`
								: '/jobs'}
							class="mt-5 inline-block font-semibold text-tide-deep underline underline-offset-4 dark:text-tide"
						>
							Clear search
						</a>
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
