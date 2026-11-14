<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { field, glassPanel, label, primaryButton, secondaryButton } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let seeker = $derived(data.user.role === 'job_seeker');
	let title = $derived(seeker ? 'Recruiters' : 'Job seekers');
	// recruiters show "Job title at Company", job seekers their headline, like on the Following page
	const tagline = (person: (typeof data.people)[number]) =>
		seeker ? [person.jobTitle, person.company].filter(Boolean).join(' at ') : person.headline;
</script>

<svelte:head><title>{title} · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">{title}</h1>
<p class="mt-2 text-ink/65">Open someone's profile to follow them.</p>

<form method="get" class="{glassPanel} mt-5 flex flex-wrap items-end gap-3 p-5">
	<label class="block min-w-0 flex-1">
		<span class={label}>Search</span>
		<input name="q" value={data.search} placeholder={seeker ? 'Name, company or job title' : 'Name or headline'} class={field} />
	</label>
	<button type="submit" class="{primaryButton} px-6 sm:w-auto">Search</button>
</form>

{#if data.people.length === 0}
	<section class="{glassPanel} mt-5 p-8 text-center">
		<p class="font-medium">{data.search ? 'Nobody matches your search.' : `No ${title.toLowerCase()} yet.`}</p>
		{#if data.search}
			<a href="/people" class="mt-3 inline-block font-semibold text-tide-deep underline underline-offset-4">Clear search</a>
		{/if}
	</section>
{:else}
	<section class="mt-5 space-y-4" aria-label={title}>
		{#each data.people as person (person.id)}
			<article class="{glassPanel} flex flex-wrap items-center justify-between gap-4 p-6">
				<div class="flex min-w-0 items-center gap-4">
					<Avatar name={person.name} image={person.image} />
					<div class="min-w-0">
						<h2 class="font-display text-xl font-semibold">
							<a href="/profile/{person.id}" class="text-tide-deep hover:underline">{person.name}</a>
						</h2>
						{#if tagline(person)}
							<p class="mt-1 text-ink/65">{tagline(person)}</p>
						{/if}
						{#if person.location}
							<p class="mt-1 text-sm text-ink/60">{person.location}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-3">
					{#if person.followingSince}
						<span class="rounded-full bg-tide/10 px-3 py-1 text-sm font-medium text-tide-deep">Following</span>
					{/if}
					<a href="/profile/{person.id}" class={secondaryButton}>View profile</a>
				</div>
			</article>
		{/each}
	</section>
	{#if data.more}
		<p class="mt-4 text-center text-sm text-ink/60">Showing the first 50. Search to find someone else.</p>
	{/if}
{/if}
