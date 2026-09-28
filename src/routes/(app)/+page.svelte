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
	<p class="max-w-xs text-ink/60">{c.empty}</p>
</section>

{#if !data.user.onboardedAt}
	<OnboardingDialog name={data.user.name.split(' ')[0]} role={data.user.role} />
{/if}
