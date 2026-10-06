<script lang="ts">
	import OnboardingDialog from '$lib/components/OnboardingDialog.svelte';
	import { glassPanel } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// ponytail: placeholder feed until the job posting/search stories land
	const copy = {
		job_seeker: {
			title: 'Jobs for you',
			empty: 'Job postings that match your profile will show up here.'
		},
		recruiter: {
			title: 'Your job postings',
			empty: 'Jobs you post and their applicants will show up here.'
		}
	};
	let c = $derived(copy[data.user.role]);
</script>

<svelte:head><title>CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">{c.title}</h1>

<section class="{glassPanel} mt-5 grid min-h-72 place-items-center p-8 text-center">
	<div class="max-w-sm">
		<p class="text-ink/60">{c.empty}</p>
		<a
			href={data.user.role === 'recruiter' ? '/jobs/new' : '/jobs'}
			class="mt-5 inline-block rounded-xl bg-tide px-5 py-3 font-semibold text-white shadow-lg shadow-tide/25 transition hover:bg-tide-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
		>
			{data.user.role === 'recruiter' ? 'Create a job posting' : 'Browse job postings'}
		</a>
		{#if data.user.role === 'recruiter'}
			<p class="mt-3 flex justify-center gap-4 text-sm font-medium text-tide-deep">
				<a href="/jobs?mine" class="hover:underline">Your postings</a>
				<a href="/jobs" class="hover:underline">All postings</a>
			</p>
		{/if}
	</div>
</section>

{#if !data.user.onboardedAt}
	<OnboardingDialog name={data.user.name.split(' ')[0]} role={data.user.role} />
{/if}
