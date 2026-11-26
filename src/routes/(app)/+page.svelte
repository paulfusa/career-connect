<script lang="ts">
	import OnboardingDialog from '$lib/components/OnboardingDialog.svelte';
	import type { PageProps } from './$types';
	import StatCard from '$lib/components/dashboard/StatCard.svelte';
	import RecentApplications from '$lib/components/dashboard/RecentApplications.svelte';
	import AttentionRequired from '$lib/components/dashboard/AttentionRequired.svelte';
	import QuickActions from '$lib/components/dashboard/QuickActions.svelte';

	let { data }: PageProps = $props();
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

	<div class="grid grid-cols-1 gap-3 min-[375px]:grid-cols-2 sm:gap-4 2xl:grid-cols-4">
		{#if data.user.role === 'recruiter'}
			<StatCard
				title="Active Job Postings"
				value={data.stats.activePostings ?? 0}
				description="Currently open positions"
				icon="briefcase"
				href="/jobs?mine&activeOnly=1"
			/>
			<StatCard
				title="Total Applications"
				value={data.stats.totalApplications}
				description="Applications received"
				icon="document"
				href="/jobs?mine&appStatus=all"
			/>
			<StatCard
				title="Awaiting Review"
				value={data.stats.awaitingReview ?? 0}
				description="Applications needing review"
				variant="attention"
				icon="clock"
				href="/jobs?mine&appStatus=applied"
			/>
			<StatCard
				title="Interviews"
				value={data.stats.interviews}
				description="Candidates in interview stage"
				variant="success"
				icon="calendar"
				href="/jobs?mine&appStatus=interview"
			/>
		{:else}
			<StatCard
				title="Total Applications"
				value={data.stats.totalApplications}
				description="Applications submitted"
				icon="document"
				href="/applications"
			/>
			<StatCard
				title="Under Review"
				value={data.stats.underReview ?? 0}
				description="Applications being reviewed"
				variant="attention"
				icon="clock"
				href="/applications?status=under_review"
			/>
			<StatCard
				title="Interviews"
				value={data.stats.interviews}
				description="Applications in interview stage"
				icon="calendar"
				href="/applications?status=interview"
			/>
			<StatCard
				title="Job Offers"
				value={data.stats.offers ?? 0}
				description="Offers received"
				variant="success"
				icon="offer"
				href="/applications?status=offered"
			/>
		{/if}
	</div>
</section>

<div class="grid min-w-0 grid-cols-1 items-start gap-6 2xl:grid-cols-3">
	<div class="min-w-0 2xl:col-span-2">
		<RecentApplications
			applications={data.recentApplications ?? []}
			role={data.user.role}
		/>
	</div>

	<div class="min-w-0">
		{#if data.user.role === 'recruiter'}
			<AttentionRequired
				role="recruiter"
				awaitingReview={data.stats.awaitingReview ?? 0}
				upcomingDeadlines={data.upcomingDeadlines ?? []}
			/>
		{:else}
			<AttentionRequired
				role="job_seeker"
				interviews={data.stats.interviews}
				offers={data.stats.offers ?? 0}
			/>
		{/if}
	</div>
</div>

<QuickActions role={data.user.role} />

{#if !data.user.onboardedAt}
	<OnboardingDialog name={data.user.name.split(' ')[0]} role={data.user.role} />
{/if}
