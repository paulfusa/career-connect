<script lang="ts">
	import OnboardingDialog from '$lib/components/OnboardingDialog.svelte';
	import { glassPanel } from '$lib/ui';
	import type { PageProps } from './$types';
	import StatCard from '$lib/components/dashboard/StatCard.svelte';
	import RecentApplications from '$lib/components/dashboard/RecentApplications.svelte';

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

<div class="mb-8">
	<p class="mb-2 text-sm font-semibold text-tide-deep">
		{data.user.role === 'recruiter'
			? 'Recruiter Dashboard'
			: 'Job Seeker Dashboard'}
	</p>

	<h1 class="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
		Welcome back, {data.user.name.split(' ')[0]}!
	</h1>

	<p class="mt-3 text-base text-ink/60">
		{data.user.role === 'recruiter'
			? "Here's what's happening with your hiring."
			: "Here's what's happening with your job search."}
	</p>
</div>

<section class="mb-8">
	<h2 class="mb-5 text-xl font-semibold text-ink">
		Overview
	</h2>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">	
		{#if data.user.role === 'recruiter'}
			<StatCard
				title="Active Job Postings"
				value={data.stats.activePostings ?? 0}
			/>
			<StatCard
				title="Total Applications"
				value={data.stats.totalApplications}
			/>
			<StatCard
				title="Awaiting Review"
				value={data.stats.awaitingReview ?? 0}
			/>
			<StatCard
				title="Interviews"
				value={data.stats.interviews}
			/>

		{:else}
			<StatCard
				title="Total Applications"
				value={data.stats.totalApplications}
			/>
			<StatCard
				title="Under Review"
				value={data.stats.underReview ?? 0}
			/>
			<StatCard
				title="Interviews"
				value={data.stats.interviews}
			/>
			<StatCard
				title="Job Offers"
				value={data.stats.offers ?? 0}
			/>
		{/if}
	</div>
</section>

<RecentApplications
	applications={data.recentApplications ?? []}
	role={data.user.role}
/>

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
