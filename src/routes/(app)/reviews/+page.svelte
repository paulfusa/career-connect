<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import FieldError from '$lib/components/FieldError.svelte';
	import StarInput from '$lib/components/StarInput.svelte';
	import Stars from '$lib/components/Stars.svelte';
	import { REVIEW_LIMITS } from '$lib/company-reviews';
	import { errorBox, field, glassPanel, label, primaryButton, secondaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	type Review = PageProps['data']['reviews'][number];
	let { data, form }: PageProps = $props();

	// same edit form as the company page
	let editing = $state<string | null>(null);
	let editRating = $state<number | null>(null);
	let saving = $state(false);
	const startEditing = (review: Review) => {
		editRating = review.rating;
		editing = review.id;
	};
	const onSave: SubmitFunction = () => {
		saving = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			saving = false;
			if (result.type === 'success') editing = null;
		};
	};

	let confirming = $state<Review | null>(null);
	let deleting = $state(false);
	const onDelete: SubmitFunction = () => {
		deleting = true;
		return async ({ update }) => {
			await update();
			deleting = false;
			confirming = null;
		};
	};

	const errors = $derived((form && 'errors' in form ? form.errors : undefined) ?? {});
	const values = $derived(form && 'values' in form ? form.values : null);
	const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
	// same check as the company page
	const wasEdited = (review: { createdAt: Date; updatedAt: Date }) =>
		review.updatedAt.getTime() - review.createdAt.getTime() > 1000;
	const textButton = 'rounded-lg px-2.5 py-1.5 text-sm font-medium focus-visible:outline-2';
</script>

<svelte:head><title>My reviews · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">My reviews</h1>
<p class="mt-2 text-ink/65">The reviews you wrote about companies.</p>

{#if form && 'updated' in form}
	<p class="{successBox} mt-5" role="status">Review updated.</p>
{:else if form && 'deleted' in form}
	<p class="{successBox} mt-5" role="status">Review deleted.</p>
{:else if form && 'message' in form}
	<p class="{errorBox} mt-5" role="alert">{form.message}</p>
{/if}

{#if data.reviews.length === 0}
	<section class="{glassPanel} mt-5 p-8 text-center">
		<p class="font-medium">You haven't reviewed any companies yet.</p>
		<p class="mt-1 text-sm text-ink/60">Open a job and click the reviews next to the company name to write one.</p>
		<a href="/jobs" class="mt-4 inline-block font-medium text-tide-deep hover:underline dark:text-tide">Browse job postings →</a>
	</section>
{:else}
	<ul class="mt-5 space-y-4" aria-label="My reviews">
		{#each data.reviews as review (review.id)}
			<li class="{glassPanel} p-6">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0">
						<a href="/companies/{review.companySlug}" class="font-display text-xl font-semibold hover:underline">{review.companyName}</a>
						<p class="text-sm text-ink/60">
							{formatDate(review.createdAt)}{#if wasEdited(review)}&nbsp;· edited{/if}
						</p>
					</div>
					{#if editing !== review.id}<Stars rating={review.rating} />{/if}
				</div>

				{#if editing === review.id}
					{@const failed = !!form && 'company' in form && form.company === review.companySlug}
					<form method="POST" action="?/edit" class="mt-4 space-y-5" use:enhance={onSave}>
						<input type="hidden" name="company" value={review.companySlug} />
						<StarInput bind:value={editRating} error={failed ? errors.rating : undefined} errorId="rating-error-{review.id}" />
						<label class="block">
							<span class={label}>Your review</span>
							<textarea
								name="body"
								required
								rows="4"
								minlength={REVIEW_LIMITS.min}
								maxlength={REVIEW_LIMITS.max}
								class={field}
								value={failed && values ? values.body : review.body}
								aria-invalid={failed && errors.body ? 'true' : undefined}
								aria-describedby="body-error-{review.id}"
							></textarea>
							<FieldError id="body-error-{review.id}" message={failed ? errors.body : undefined} />
						</label>
						<div class="flex flex-wrap gap-2">
							<button type="submit" class="{primaryButton} sm:w-auto sm:px-6" disabled={saving}>
								{saving ? 'Saving…' : 'Save changes'}
							</button>
							<button type="button" class={secondaryButton} onclick={() => (editing = null)}>Cancel</button>
						</div>
					</form>
				{:else}
					<p class="mt-4 whitespace-pre-line">{review.body}</p>
					<div class="mt-4 flex gap-2">
						<button
							type="button"
							onclick={() => startEditing(review)}
							aria-label="Edit your review of {review.companyName}"
							class="{textButton} text-tide-deep hover:bg-tide/10 focus-visible:outline-tide dark:text-tide dark:hover:bg-white/10"
						>
							Edit
						</button>
						<button
							type="button"
							onclick={() => (confirming = review)}
							aria-label="Delete your review of {review.companyName}"
							class="{textButton} text-rose-700 hover:bg-rose-50/80 focus-visible:outline-rose-600
								dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
						>
							Delete
						</button>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

{#if confirming}
	<ConfirmDialog
		title="Delete your review?"
		message="Your review of {confirming.companyName} will be deleted. This can’t be undone."
		oncancel={() => (confirming = null)}
	>
		<form method="POST" action="?/delete" use:enhance={onDelete}>
			<input type="hidden" name="company" value={confirming.companySlug} />
			<button
				disabled={deleting}
				class="w-full rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-70"
			>
				{deleting ? 'Deleting…' : 'Delete review'}
			</button>
		</form>
	</ConfirmDialog>
{/if}
