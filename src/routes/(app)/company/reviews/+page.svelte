<script lang="ts">
	import Stars from '$lib/components/Stars.svelte';
	import { glassPanel } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Company reviews · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">Company reviews</h1>
<p class="mt-2 text-ink/65">Reviews of the companies on your Company Profile.</p>

{#if data.companies.length === 0}
	<section class="{glassPanel} mt-5 p-8 text-center">
		<p class="font-medium">You don't have a company yet.</p>
		<p class="mt-1 text-sm text-ink/60">Add a company profile and you'll see its reviews here.</p>
		<a href="/company/edit" class="mt-4 inline-block font-medium text-tide-deep hover:underline dark:text-tide">Create Company Profile →</a>
	</section>
{:else}
	<ul class="mt-5 space-y-3" aria-label="Your companies">
		{#each data.companies as company (company.slug)}
			<li>
				<a
					href="/companies/{company.slug}"
					class="{glassPanel} flex flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-white/80 dark:hover:bg-white/10"
				>
					<span class="font-display text-lg font-semibold">{company.name}</span>
					<span class="flex items-center gap-1.5 text-sm text-ink/65">
						{#if company.rating}
							<Stars rating={company.rating.average} />
							{company.rating.average.toFixed(1)} · {company.rating.count} {company.rating.count === 1 ? 'review' : 'reviews'}
						{:else}
							No reviews yet
						{/if}
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}
