<script lang="ts">
	import { enhance } from '$app/forms';
	import { withPending } from '$lib/forms';
	import { errorBox, field, glassPanel, label, primaryButton } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let pending = $state(false);
	let review = $derived(data.resume.review);
	const dateFmt = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
	const card = `${glassPanel} p-6`;
	const heading = 'font-display text-xl font-semibold';
</script>

<svelte:head><title>Resume review · CareerConnect</title></svelte:head>

<div class="space-y-5 md:mt-14">
	<div>
		<a href="/resumes" class="text-sm font-medium text-tide-deep hover:underline">← Resumes</a>
		<h1 class="mt-3 font-display text-3xl font-semibold tracking-tight">Resume review</h1>
		<p class="mt-2 text-ink/60">AI feedback on <span class="font-medium text-ink/80">{data.resume.fileName}</span></p>
	</div>

	{#if !data.ai.configured}
		<p class={card}>AI features aren’t set up on this server yet. See <code>docs/ai-setup.md</code> to turn them on.</p>
	{:else}
		<form method="post" action="?/run" class={card} use:enhance={withPending((v) => (pending = v))}>
			<label class="block">
				<span class={label}>Tailor the review to a job posting (optional)</span>
				<select name="jobId" class={field} disabled={pending}>
					<option value="">General review</option>
					{#each data.jobs as job (job.id)}
						<option value={job.id} selected={review?.job?.id === job.id}>{job.title} at {job.company}</option>
					{/each}
				</select>
			</label>
			<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
				<button type="submit" disabled={pending} class="{primaryButton} sm:w-auto sm:px-6">
					{pending ? 'Reviewing…' : review ? 'Review again' : 'Review my resume'}
				</button>
				<p class="text-sm text-ink/55" aria-live="polite">
					{#if pending}
						{data.ai.local
							? 'Reading your resume on a local AI model. This can take a minute or two; keep this page open.'
							: 'Reading your resume. This usually takes a few seconds.'}
					{:else if review}
						A new review replaces the one below.
					{/if}
				</p>
			</div>
			{#if form?.error && !pending}<p role="alert" class="{errorBox} mt-4">{form.error}</p>{/if}
		</form>
	{/if}

	{#if review}
		<div class="space-y-5 transition-opacity {pending ? 'opacity-50' : ''}" aria-busy={pending}>
			<section class={card}>
				<h2 class={heading}>Overall</h2>
				<p class="mt-3 text-ink/85">{review.summary}</p>
			</section>

			{#if review.job && review.jobFit}
				<section class="{card} ring-1 ring-tide/30">
					<h2 class={heading}>Fit for {review.job.title} at {review.job.company}</h2>
					<p class="mt-3 text-ink/85">{review.jobFit}</p>
				</section>
			{/if}

			{#if review.strengths.length}
				<section class={card}>
					<h2 class={heading}>What works</h2>
					<ul class="mt-3 list-disc space-y-2 pl-5 text-ink/85 marker:text-emerald-600">
						{#each review.strengths as s (s)}<li>{s}</li>{/each}
					</ul>
				</section>
			{/if}

			{#if review.improvements.length}
				<section class={card}>
					<h2 class={heading}>What to improve</h2>
					<ul class="mt-2 divide-y divide-white/60">
						{#each review.improvements as item (item.issue)}
							<li class="py-4 last:pb-0">
								{#if item.section}
									<span class="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-ink/65 ring-1 ring-white">{item.section}</span>
								{/if}
								<p class="mt-2 font-medium">{item.issue}</p>
								<p class="mt-1 text-ink/75">{item.suggestion}</p>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if review.rewrites.length}
				<section class={card}>
					<h2 class={heading}>Stronger bullet points</h2>
					<p class="mt-1 text-sm text-ink/55">Suggestions only. Check each one still describes what you actually did, and replace any [placeholder] with your real numbers.</p>
					<ul class="mt-3 space-y-4">
						{#each review.rewrites as r (r.original)}
							<li class="grid gap-2 sm:grid-cols-2">
								<div class="rounded-xl bg-white/45 p-3.5">
									<p class="text-xs font-semibold text-ink/50">Now</p>
									<p class="mt-1 text-sm text-ink/70">{r.original}</p>
								</div>
								<div class="rounded-xl bg-tide/10 p-3.5 ring-1 ring-tide/25">
									<p class="text-xs font-semibold text-tide-deep">Suggested</p>
									<p class="mt-1 text-sm">{r.improved}</p>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if review.missingKeywords.length}
				<section class={card}>
					<h2 class={heading}>{review.job ? 'In the posting but not in your resume' : 'Keywords worth adding'}</h2>
					<p class="mt-1 text-sm text-ink/55">Only add the ones you can honestly back up.</p>
					<ul class="mt-3 flex flex-wrap gap-2">
						{#each review.missingKeywords as k (k)}
							<li class="rounded-full bg-white/70 px-3 py-1 text-sm ring-1 ring-white">{k}</li>
						{/each}
					</ul>
				</section>
			{/if}

			<p class="text-xs text-ink/50">
				Generated by AI ({review.model}){data.resume.reviewedAt ? ` on ${dateFmt.format(data.resume.reviewedAt)}` : ''}. It can be
				wrong or miss context, so treat it as a second opinion.
			</p>
		</div>
	{/if}
</div>
