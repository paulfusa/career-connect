<script lang="ts">
	import { enhance } from '$app/forms';
	import { errorBox, glassPanel, secondaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
	// recruiters show "Job title at Company", job seekers their headline
	const tagline = (person: (typeof data.following)[number]) =>
		person.role === 'recruiter' ? [person.jobTitle, person.company].filter(Boolean).join(' at ') : person.headline;
</script>

<svelte:head><title>Following · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">Following</h1>

{#if form?.message}
	<p class="{errorBox} mt-5" role="alert">{form.message}</p>
{:else if form?.success}
	<p class="{successBox} mt-5" role="status">{form.success}</p>
{/if}

{#if data.following.length === 0}
	<section class="{glassPanel} mt-5 p-8 text-center">
		<p class="font-medium">You don't follow anyone yet.</p>
		<p class="mt-2 text-sm text-ink/65">
			Look through
			<a href="/people" class="font-semibold text-tide-deep underline underline-offset-4">{data.user.role === 'job_seeker' ? 'Recruiters' : 'Job seekers'}</a>
			and follow someone from their profile.
		</p>
	</section>
{:else}
	<section class="mt-5 space-y-4" aria-label="People you follow">
		{#each data.following as person (person.id)}
			<article class="{glassPanel} flex flex-wrap items-center justify-between gap-4 p-6">
				<div class="min-w-0">
					<h2 class="font-display text-xl font-semibold">
						<a href="/profile/{person.id}" class="text-tide-deep hover:underline">{person.name}</a>
					</h2>
					{#if tagline(person)}
						<p class="mt-1 text-ink/65">{tagline(person)}</p>
					{/if}
					<p class="mt-2 text-sm text-ink/60">
						{person.role === 'recruiter' ? 'Recruiter' : 'Job seeker'} · Following since {formatDate(person.since)}
					</p>
				</div>
				<form method="POST" action="?/unfollow" use:enhance>
					<input type="hidden" name="userId" value={person.id} />
					<button type="submit" class={secondaryButton}>Unfollow</button>
				</form>
			</article>
		{/each}
	</section>
{/if}
