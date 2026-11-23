<script lang="ts">
	import JobPostingForm from '$lib/components/JobPostingForm.svelte';
	import { glassPanel } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Create a job posting · CareerConnect</title></svelte:head>

<div>
	<a href="/jobs" class="text-sm font-medium text-tide-deep hover:underline">← All job postings</a>
	<h1 class="mt-3 font-display text-3xl font-semibold tracking-tight">Create a job posting</h1>
	<p class="mt-2 text-ink/60">Share an opportunity with job seekers on CareerConnect.</p>

	<section class="{glassPanel} mt-6 p-6 sm:p-8">
		<!-- US-34: you need a company before you can post -->
		{#if data.companies.length === 0}
			<p class="font-medium">You need a company profile before you can post a job.</p>
			<a href="/company/edit" class="mt-3 inline-block font-medium text-tide-deep hover:underline dark:text-tide">Create Company Profile →</a>
		{:else}
			<JobPostingForm action="?/create" submitLabel="Publish posting" values={form?.values ?? {}} errors={form?.errors} companies={data.companies} />
		{/if}
	</section>
</div>
