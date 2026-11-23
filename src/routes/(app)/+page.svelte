<script lang="ts">
	import OnboardingDialog from '$lib/components/OnboardingDialog.svelte';
	import { glassPanel } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const copy = {
		job_seeker: {
			title: 'Jobs for you',
			empty: 'Let AI find the open postings that fit your profile and resume.'
		},
		recruiter: {
			title: 'Your job postings',
			empty: 'Jobs you post and their applicants will show up here.'
		}
	};
	let c = $derived(copy[data.user.role]);
</script>

<svelte:head><title>CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight">{c.title}</h1>

<section class="{glassPanel} mt-5 grid min-h-72 place-items-center p-8 text-center">
	<div class="max-w-sm">
		<p class="text-ink/60">{c.empty}</p>
		<a
			href={data.user.role === 'recruiter' ? '/jobs/new' : '/matches'}
			class="mt-5 inline-block rounded-xl bg-tide px-5 py-3 font-semibold text-white shadow-lg shadow-tide/25 transition hover:bg-tide-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
		>
			{data.user.role === 'recruiter' ? 'Create a job posting' : 'See your job matches'}
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
