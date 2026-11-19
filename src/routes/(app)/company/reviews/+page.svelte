<script lang="ts">
	import { glassPanel } from '$lib/ui';
</script>

<svelte:head><title>Company reviews · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">Company reviews</h1>

<section class="{glassPanel} mt-5 p-8 text-center">
	<p class="font-medium">You don't have a company profile yet.</p>
	<p class="mt-1 text-sm text-ink/60">Once you make one, job seekers can review your company and you'll see their reviews here.</p>
	<a href="/company/edit" class="mt-4 inline-block font-medium text-tide-deep hover:underline dark:text-tide">Create Company Profile →</a>
</section>
