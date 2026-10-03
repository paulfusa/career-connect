<script lang="ts">
	import JobPostingForm from '$lib/components/JobPostingForm.svelte';
	import { glassPanel } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Edit job posting · CareerConnect</title></svelte:head>

<div class="md:mt-14">
	<a href="/jobs/{data.posting.id}" class="text-sm font-medium text-tide-deep hover:underline">← Back to posting</a>
	<h1 class="mt-3 font-display text-3xl font-semibold tracking-tight">Edit job posting</h1>
	<section class="{glassPanel} mt-6 p-6 sm:p-8">
		<JobPostingForm
			action="?/save"
			submitLabel="Save changes"
			values={form?.values ?? data.posting}
			errors={form?.errors}
		/>
	</section>
</div>
