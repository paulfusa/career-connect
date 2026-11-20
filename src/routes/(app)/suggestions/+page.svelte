<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import FieldError from '$lib/components/FieldError.svelte';
	import { SUGGESTION_LIMITS, SUGGESTION_STATUSES } from '$lib/feature-suggestions';
	import { withPending } from '$lib/forms';
	import { errorBox, field, glassPanel, hint, label, primaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let sending = $state(false);
	// delete works like on the Resumes page
	let confirming = $state<(typeof data.mine)[number] | null>(null);
	let deleting = $state(false);
	const onDelete = () => {
		deleting = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			deleting = false;
			confirming = null;
		};
	};
	const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
	const errors = $derived((form && 'errors' in form ? form.errors : undefined) ?? {});
	const values = $derived(form && 'values' in form ? form.values : null);
</script>

<svelte:head><title>Suggest a feature · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight">Suggest a feature</h1>
<p class="mt-2 text-ink/65">
	Is something missing on CareerConnect? Tell us what you'd like and how it would help you. The team reads every
	suggestion, but sending one doesn't mean it will be built.
</p>

{#if form && 'success' in form}
	<p class="{successBox} mt-5" role="status">
		Thanks, your suggestion was sent. You can follow its status below.
	</p>
{:else if form && 'deleted' in form}
	<p class="{successBox} mt-5" role="status">Suggestion deleted.</p>
{:else if form && 'message' in form}
	<p class="{errorBox} mt-5" role="alert">{form.message}</p>
{/if}

<form
	method="POST"
	action="?/suggest"
	class="{glassPanel} mt-5 space-y-5 p-6"
	use:enhance={withPending((pending) => (sending = pending), true)}
>
	<label class="block">
		<span class={label}>Title</span>
		<input
			name="title"
			required
			minlength={SUGGESTION_LIMITS.title.min}
			maxlength={SUGGESTION_LIMITS.title.max}
			placeholder="For example: save jobs to look at later"
			class={field}
			value={values?.title ?? ''}
			aria-invalid={errors.title ? 'true' : undefined}
			aria-describedby="title-error"
		/>
		<FieldError id="title-error" message={errors.title} />
	</label>

	<label class="block">
		<span class={label}>Description</span>
		<textarea
			name="description"
			required
			rows="4"
			minlength={SUGGESTION_LIMITS.description.min}
			maxlength={SUGGESTION_LIMITS.description.max}
			placeholder="What should the feature do?"
			class={field}
			value={values?.description ?? ''}
			aria-invalid={errors.description ? 'true' : undefined}
			aria-describedby="description-error"
		></textarea>
		<FieldError id="description-error" message={errors.description} />
	</label>

	<label class="block">
		<span class={label}>How would it help you?</span>
		<textarea
			name="benefit"
			required
			rows="3"
			minlength={SUGGESTION_LIMITS.benefit.min}
			maxlength={SUGGESTION_LIMITS.benefit.max}
			placeholder="For example: I find jobs on my phone and want to apply later from my laptop."
			class={field}
			value={values?.benefit ?? ''}
			aria-invalid={errors.benefit ? 'true' : undefined}
			aria-describedby="benefit-error benefit-hint"
		></textarea>
		<span id="benefit-hint" class={hint}>Tell us who it helps and why. It helps the team decide what to build first.</span>
		<FieldError id="benefit-error" message={errors.benefit} />
	</label>

	<button type="submit" class={primaryButton} disabled={sending}>
		{sending ? 'Sending…' : 'Send suggestion'}
	</button>
</form>

<h2 class="mt-10 font-display text-2xl font-semibold">Your suggestions</h2>
{#if data.mine.length === 0}
	<p class="mt-3 text-ink/65">You haven't sent any suggestions yet.</p>
{:else}
	<ul class="mt-4 space-y-3" aria-label="Your suggestions">
		{#each data.mine as suggestion (suggestion.id)}
			<li class="{glassPanel} flex flex-wrap items-center justify-between gap-3 p-5">
				<div class="min-w-0">
					<p class="font-semibold">{suggestion.title}</p>
					<p class="mt-1 text-sm text-ink/60">Sent {formatDate(suggestion.createdAt)}</p>
				</div>
				<div class="flex items-center gap-2">
					<span
						class="rounded-full px-2.5 py-1 text-xs font-semibold
							{suggestion.status === 'planned'
							? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
							: suggestion.status === 'not_planned'
								? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
								: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-300'}"
					>
						{SUGGESTION_STATUSES[suggestion.status]}
					</span>
					<!-- can only delete while it's New -->
					{#if suggestion.status === 'new'}
						<button
							type="button"
							onclick={() => (confirming = suggestion)}
							aria-label="Delete {suggestion.title}"
							class="rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50/80
								dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300
								focus-visible:outline-2 focus-visible:outline-rose-600"
						>
							Delete
						</button>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}

{#if confirming}
	<ConfirmDialog
		title="Delete this suggestion?"
		message="“{confirming.title}” will be deleted. This can’t be undone."
		oncancel={() => (confirming = null)}
	>
		<form method="POST" action="?/delete" use:enhance={onDelete}>
			<input type="hidden" name="id" value={confirming.id} />
			<button
				disabled={deleting}
				class="w-full rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-70"
			>
				{deleting ? 'Deleting…' : 'Delete suggestion'}
			</button>
		</form>
	</ConfirmDialog>
{/if}
