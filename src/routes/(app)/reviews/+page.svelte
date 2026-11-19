<script lang="ts">
	import Stars from '$lib/components/Stars.svelte';
	import { glassPanel } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
	// same check as the company page
	const wasEdited = (review: { createdAt: Date; updatedAt: Date }) =>
		review.updatedAt.getTime() - review.createdAt.getTime() > 1000;
</script>

<svelte:head><title>My reviews · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">My reviews</h1>
<p class="mt-2 text-ink/65">The reviews you wrote about companies. Open a company to edit or delete yours.</p>

{#if data.ownCompany}
	<a
		href="/companies/{data.ownCompany.id}"
		class="mt-5 block w-fit rounded-xl border border-white/60 bg-white/70 px-5 py-3 font-medium text-tide-deep hover:bg-white
			dark:border-white/15 dark:bg-[#303034] dark:text-[#7dd3df] dark:hover:bg-[#404044]"
	>
		See what people wrote about {data.ownCompany.name}
	</a>
{/if}

{#if data.reviews.length === 0}
	<section class="{glassPanel} mt-5 p-8 text-center">
		<p class="font-medium">You haven't reviewed any companies yet.</p>
		<p class="mt-1 text-sm text-ink/60">Open a job posting and click the company name to leave a review.</p>
		<a href="/jobs" class="mt-4 inline-block font-medium text-tide-deep hover:underline dark:text-tide">Browse job postings →</a>
	</section>
{:else}
	<ul class="mt-5 space-y-4" aria-label="My reviews">
		{#each data.reviews as review (review.id)}
			<li class="{glassPanel} p-6">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0">
						<a href="/companies/{review.companyId}" class="font-display text-xl font-semibold hover:underline">{review.companyName}</a>
						<p class="text-sm text-ink/60">
							{review.companyLocation} · {formatDate(review.createdAt)}{#if wasEdited(review)}&nbsp;· edited{/if}
						</p>
					</div>
					<Stars rating={review.rating} />
				</div>
				<p class="mt-4 whitespace-pre-line">{review.body}</p>
				<a href="/companies/{review.companyId}" class="mt-4 inline-block text-sm font-medium text-tide-deep hover:underline dark:text-tide">
					Edit or delete →
				</a>
			</li>
		{/each}
	</ul>
{/if}
