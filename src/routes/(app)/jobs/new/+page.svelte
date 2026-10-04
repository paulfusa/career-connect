<script lang="ts">
	import JobPostingForm from '$lib/components/JobPostingForm.svelte';
	import { glassPanel } from '$lib/ui';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Create a job posting · CareerConnect</title></svelte:head>

<div class="md:mt-14">
	<a href="/jobs" class="text-sm font-medium text-tide-deep hover:underline">← All job postings</a>
	<h1 class="mt-3 font-display text-3xl font-semibold tracking-tight">Create a job posting</h1>
	<p class="mt-2 text-ink/60">Share an opportunity with job seekers on CareerConnect.</p>

	<section class="{glassPanel} mt-6 p-6 sm:p-8">
		<JobPostingForm action="?/create" submitLabel="Publish posting" values={form?.values ?? {}} errors={form?.errors} />
	</section>
</div>
