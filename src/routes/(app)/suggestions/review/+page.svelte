<script lang="ts">
	import { enhance } from '$app/forms';
	import { SUGGESTION_STATUSES, type SuggestionStatus } from '$lib/feature-suggestions';
	import { errorBox, field, glassPanel, secondaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
	const statuses = Object.entries(SUGGESTION_STATUSES) as [SuggestionStatus, string][];
	const filters = [{ value: null, label: 'All' }, ...statuses.map(([value, label]) => ({ value, label }))];
</script>

<svelte:head><title>Review suggestions · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">Review suggestions</h1>
<p class="mt-2 text-ink/65">Feature ideas from job seekers and recruiters. Set a status so they know where their idea stands.</p>

<nav aria-label="Filter by status" class="mt-5 flex flex-wrap gap-2">
	{#each filters as filter (filter.label)}
		<a
			href={filter.value ? `?status=${filter.value}` : '?'}
			aria-current={data.status === filter.value ? 'page' : undefined}
			class="rounded-full border border-white/70 bg-white/50 px-3.5 py-1.5 text-sm font-medium transition hover:bg-white/70
				aria-[current=page]:border-tide aria-[current=page]:bg-tide/10 aria-[current=page]:text-tide-deep
				dark:border-white/15 dark:bg-[#242427] dark:hover:bg-[#303034] dark:aria-[current=page]:text-[#7dd3df]"
		>
			{filter.label}
		</a>
	{/each}
</nav>

{#if form && 'message' in form}
	<p class="{errorBox} mt-5" role="alert">{form.message}</p>
{/if}

{#if data.suggestions.length === 0}
	<section class="{glassPanel} mt-5 p-8 text-center">
		<p class="font-medium">No suggestions here yet.</p>
	</section>
{:else}
	<section class="mt-5 space-y-4" aria-label="Suggestions">
		{#each data.suggestions as suggestion (suggestion.id)}
			<article class="{glassPanel} p-6">
				<h2 class="font-display text-xl font-semibold">{suggestion.title}</h2>
				<p class="mt-1 text-sm text-ink/60">
					<!-- no link, profiles only open for the other role (US-19) -->
					{suggestion.authorName} · {suggestion.authorRole === 'recruiter' ? 'Recruiter' : 'Job seeker'} · {formatDate(suggestion.createdAt)}
				</p>
				<p class="mt-4 whitespace-pre-line">{suggestion.description}</p>
				<p class="mt-4 text-sm font-semibold">How it would help</p>
				<p class="mt-1 whitespace-pre-line text-ink/80">{suggestion.benefit}</p>

				<form method="POST" action="?/status" class="mt-5 flex flex-wrap items-end gap-3" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<input type="hidden" name="id" value={suggestion.id} />
					<label class="block w-full sm:w-56">
						<span class="text-sm font-medium">Status</span>
						<select name="status" class={field} value={suggestion.status}>
							{#each statuses as [value, text] (value)}
								<option {value}>{text}</option>
							{/each}
						</select>
					</label>
					<button type="submit" class={secondaryButton}>Save</button>
					{#if form && 'success' in form && form.id === suggestion.id}
						<span class="{successBox} py-2" role="status">{form.success}</span>
					{/if}
				</form>
			</article>
		{/each}
	</section>
{/if}
