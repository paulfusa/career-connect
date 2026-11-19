<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Avatar from '$lib/components/Avatar.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import FieldError from '$lib/components/FieldError.svelte';
	import StarInput from '$lib/components/StarInput.svelte';
	import Stars from '$lib/components/Stars.svelte';
	import { REVIEW_LIMITS } from '$lib/company-reviews';
	import { withPending } from '$lib/forms';
	import { errorBox, field, glassPanel, hint, label, primaryButton, secondaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const company = $derived(data.company);
	const mine = $derived(data.reviews.find((review) => review.mine));

	let rating = $state<number | null>(null);
	let posting = $state(false);

	// you edit your review in place
	let editing = $state(false);
	let editRating = $state<number | null>(null);
	let saving = $state(false);
	const startEditing = () => {
		editRating = mine?.rating ?? null;
		editing = true;
	};
	const onSave: SubmitFunction = () => {
		saving = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			saving = false;
			if (result.type === 'success') editing = false;
		};
	};

	let confirming = $state(false);
	let deleting = $state(false);
	const onDelete: SubmitFunction = () => {
		deleting = true;
		return async ({ update }) => {
			await update();
			deleting = false;
			confirming = false;
			rating = null;
		};
	};

	const errors = $derived((form && 'errors' in form ? form.errors : undefined) ?? {});
	const values = $derived(form && 'values' in form ? form.values : null);
	// errors can come from the post form or the edit form
	const editFailed = $derived(!!form && 'editing' in form);
	const postErrors = $derived(editFailed ? {} : errors);
	const editErrors = $derived(editFailed ? errors : {});

	const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
	// both dates are the same until someone edits it
	const wasEdited = (review: { createdAt: Date; updatedAt: Date }) =>
		review.updatedAt.getTime() - review.createdAt.getTime() > 1000;
	const textButton = 'rounded-lg px-2.5 py-1.5 text-sm font-medium focus-visible:outline-2';
</script>

<svelte:head><title>{company.name} · CareerConnect</title></svelte:head>

<section class="{glassPanel} p-6 md:mt-14">
	<div class="flex items-center gap-4">
		<div
			class="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/70 bg-white font-display text-2xl font-bold text-slate-700 shadow-sm
				dark:border-white/15 dark:bg-[#242427] dark:text-[#7dd3df]"
		>
			{company.name.charAt(0).toUpperCase()}
		</div>
		<div class="min-w-0">
			<h1 class="font-display text-3xl font-semibold tracking-tight">{company.name}</h1>
			<p class="mt-1 text-sm text-ink/60">{company.location}</p>
		</div>
	</div>
	<p class="mt-5 whitespace-pre-line leading-7 text-ink/75">{company.description}</p>
	{#if company.website}
		<a
			href={company.website}
			target="_blank"
			rel="noopener noreferrer"
			class="mt-3 inline-block font-medium text-tide-deep hover:underline dark:text-tide"
		>
			Visit company website →
		</a>
	{/if}
</section>

<section class="mt-8" aria-labelledby="reviews-heading">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 id="reviews-heading" class="font-display text-2xl font-semibold">Reviews</h2>
		{#if data.summary.average !== null}
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
				<Stars rating={data.summary.average} size="lg" />
				<p>
					<span class="font-semibold">{data.summary.average.toFixed(1)} out of 5</span>
					<span class="text-ink/60">from {data.summary.count} {data.summary.count === 1 ? 'review' : 'reviews'}</span>
				</p>
			</div>
		{/if}
	</div>
	<p class={hint}>Reviews are written by CareerConnect users and aren't checked by CareerConnect.</p>

	{#if form && 'posted' in form}
		<p class="{successBox} mt-5" role="status">Thanks, your review was posted.</p>
	{:else if form && 'updated' in form}
		<p class="{successBox} mt-5" role="status">Review updated.</p>
	{:else if form && 'deleted' in form}
		<p class="{successBox} mt-5" role="status">Review deleted.</p>
	{:else if form && 'message' in form}
		<p class="{errorBox} mt-5" role="alert">{form.message}</p>
	{/if}

	{#if data.isOwner}
		<p class="mt-5 text-ink/65">This is your company, so you can't review it. You can still see what people wrote.</p>
	{:else if data.canReview && !mine}
		<form
			method="POST"
			action="?/post"
			class="{glassPanel} mt-5 space-y-5 p-6"
			use:enhance={withPending((pending) => (posting = pending), true)}
		>
			<StarInput bind:value={rating} error={postErrors.rating} errorId="rating-error" />
			<label class="block">
				<span class={label}>Your review</span>
				<textarea
					name="body"
					required
					rows="4"
					minlength={REVIEW_LIMITS.min}
					maxlength={REVIEW_LIMITS.max}
					placeholder="What was it like to apply, interview or work there?"
					class={field}
					value={values?.body ?? ''}
					aria-invalid={postErrors.body ? 'true' : undefined}
					aria-describedby="body-error"
				></textarea>
				<FieldError id="body-error" message={postErrors.body} />
			</label>
			<button type="submit" class={primaryButton} disabled={posting}>
				{posting ? 'Posting…' : 'Post review'}
			</button>
		</form>
	{/if}

	{#if data.reviews.length === 0}
		<div class="{glassPanel} mt-5 p-8 text-center">
			<p class="font-medium">No reviews yet</p>
			{#if data.canReview}
				<p class="mt-1 text-sm text-ink/60">Be the first to review {company.name}.</p>
			{/if}
		</div>
	{:else}
		<ul class="mt-5 space-y-4" aria-label="Reviews">
			{#each data.reviews as review (review.id)}
				<li class="{glassPanel} p-6">
					{#if review.mine && editing}
						<form method="POST" action="?/edit" class="space-y-5" use:enhance={onSave}>
							<StarInput bind:value={editRating} error={editErrors.rating} errorId="edit-rating-error" />
							<label class="block">
								<span class={label}>Your review</span>
								<textarea
									name="body"
									required
									rows="4"
									minlength={REVIEW_LIMITS.min}
									maxlength={REVIEW_LIMITS.max}
									class={field}
									value={editFailed && values ? values.body : review.body}
									aria-invalid={editErrors.body ? 'true' : undefined}
									aria-describedby="edit-body-error"
								></textarea>
								<FieldError id="edit-body-error" message={editErrors.body} />
							</label>
							<div class="flex flex-wrap gap-2">
								<button type="submit" class="{primaryButton} sm:w-auto sm:px-6" disabled={saving}>
									{saving ? 'Saving…' : 'Save changes'}
								</button>
								<button type="button" class={secondaryButton} onclick={() => (editing = false)}>Cancel</button>
							</div>
						</form>
					{:else}
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="flex min-w-0 items-center gap-3">
								<Avatar name={review.authorName} image={review.authorImage} size="sm" />
								<div class="min-w-0">
									<p class="font-semibold">
										{review.authorName}
										{#if review.mine}<span class="text-sm font-normal text-ink/60">(you)</span>{/if}
									</p>
									<p class="text-sm text-ink/60">
										{formatDate(review.createdAt)}{#if wasEdited(review)}&nbsp;· edited{/if}
									</p>
								</div>
							</div>
							<Stars rating={review.rating} />
						</div>
						<p class="mt-4 whitespace-pre-line">{review.body}</p>
						{#if review.mine}
							<div class="mt-4 flex gap-2">
								<button
									type="button"
									onclick={startEditing}
									class="{textButton} text-tide-deep hover:bg-tide/10 focus-visible:outline-tide dark:text-tide dark:hover:bg-white/10"
								>
									Edit
								</button>
								<button
									type="button"
									onclick={() => (confirming = true)}
									class="{textButton} text-rose-700 hover:bg-rose-50/80 focus-visible:outline-rose-600
										dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
								>
									Delete
								</button>
							</div>
						{/if}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if confirming}
	<ConfirmDialog
		title="Delete your review?"
		message="Your review of {company.name} will be deleted. This can’t be undone."
		oncancel={() => (confirming = false)}
	>
		<form method="POST" action="?/delete" use:enhance={onDelete}>
			<button
				disabled={deleting}
				class="w-full rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-70"
			>
				{deleting ? 'Deleting…' : 'Delete review'}
			</button>
		</form>
	</ConfirmDialog>
{/if}
