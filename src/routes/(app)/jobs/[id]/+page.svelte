<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import AcceptanceRate from '$lib/components/AcceptanceRate.svelte';
	import OrgLogo from '$lib/components/OrgLogo.svelte';
	import OutcomeMessage from '$lib/components/OutcomeMessage.svelte';
	import { EMPLOYMENT_TYPES, WORK_MODES } from '$lib/profile-options';
	import { glassPanel, primaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let selectedResumeId = $state('');
	let applicationMessage = $state('');
	let applicationError = $state('');
	let submitting = $state(false);
	let { data }: PageProps = $props();
	let posting = $derived(data.posting);
	// turns '2026-10-23' into 'Oct 23, 2026'; the T00:00 keeps it in local time, otherwise it shows a day early
	const formatDate = (value: string) => new Date(`${value}T00:00`).toLocaleDateString('en-CA', { dateStyle: 'medium' });
	// formats 50000 as $50,000
	const formatMoney = (amount: number) => `$${amount.toLocaleString('en-CA')}`;

</script>

<svelte:head><title>{posting.title} · CareerConnect</title></svelte:head>

<div class="md:mt-14">
	<a href="/jobs" class="text-sm font-medium text-tide-deep hover:underline">← All job postings</a>
	{#if page.url.searchParams.has('saved')}
		<p role="status" class="{successBox} mt-4">Job posting updated.</p>
	{/if}

	<article class="{glassPanel} mt-5 p-6 sm:p-9">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex min-w-0 items-start gap-4">
				<OrgLogo name={posting.company} domain={posting.companyDomain} />
				<div class="min-w-0">
					<p class="text-sm font-medium uppercase tracking-widest text-tide-deep">{posting.company}</p>
					<h1 class="mt-2 font-display text-3xl font-semibold tracking-tight">{posting.title}</h1>
					<p class="mt-2 text-ink/65">{posting.location} <span aria-hidden="true">·</span> Posted by {data.creatorName}</p>
				</div>
			</div>
	{#if data.isOwner}
		<div class="flex flex-wrap gap-3">
			<a
				href="/jobs/{posting.id}/applications"
				class={primaryButton + ' px-5 text-center sm:w-auto'}
			>
				View Applications
			</a>

			<a
				href="/jobs/{posting.id}/edit"
				class="rounded-xl border border-white/60 bg-white/70 px-5 py-3 text-center font-medium text-tide-deep hover:bg-white"
			>
				Edit posting
			</a>
		</div>
	{/if}
		</div>

		<div class="mt-5 flex flex-wrap gap-2 text-sm">
			<span class="rounded-full bg-white/65 px-3 py-1">{EMPLOYMENT_TYPES[posting.employmentType as keyof typeof EMPLOYMENT_TYPES] ?? posting.employmentType}</span>
			<span class="rounded-full bg-white/65 px-3 py-1">{WORK_MODES[posting.workMode as keyof typeof WORK_MODES] ?? posting.workMode}</span>
			{#if posting.status === 'open'}
				<span class="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">Open</span>
			{:else}
				<span class="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-800">Closed</span>
			{/if}
			{#if !posting.published}
				<span class="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">Draft</span>
			{/if}
		</div>

		{#if posting.status === 'closed'}
			<p role="status" class="mt-5 rounded-2xl bg-rose-50 px-4 py-3 font-medium text-rose-800">This job is no longer receiving applications.</p>
		{/if}

		{#if posting.applicationDeadline}
			<p class="mt-5 text-ink/75">
				<span class="font-medium">Application deadline:</span> {formatDate(posting.applicationDeadline)}
			</p>
		{/if}

		{#if posting.salaryMin !== null && posting.salaryMax !== null}
			<p class="mt-2 text-ink/75"><span class="font-medium">Salary:</span> {formatMoney(posting.salaryMin)} – {formatMoney(posting.salaryMax)}</p>
		{:else if posting.salaryMin !== null}
			<p class="mt-2 text-ink/75"><span class="font-medium">Salary:</span> From {formatMoney(posting.salaryMin)}</p>
		{:else if posting.salaryMax !== null}
			<p class="mt-2 text-ink/75"><span class="font-medium">Salary:</span> Up to {formatMoney(posting.salaryMax)}</p>
		{/if}

		<AcceptanceRate rate={data.acceptanceRate} />

		<section class="mt-8 border-t border-white/60 pt-6">
			<h2 class="font-display text-xl font-semibold">About the role</h2>
			<p class="mt-3 whitespace-pre-line leading-7 text-ink/75">{posting.description}</p>
		</section>

		{#if posting.requirements}
			<section class="mt-8 border-t border-white/60 pt-6">
				<h2 class="font-display text-xl font-semibold">Requirements</h2>
				<p class="mt-3 whitespace-pre-line leading-7 text-ink/75">
					{posting.requirements}
				</p>
			</section>
		{/if}
		
		{#if data.companyProfile}
			<section class="mt-8 border-t border-white/60 pt-6">
				<h2 class="font-display text-xl font-semibold">
					About {data.companyProfile.name}
				</h2>

				<p class="mt-3 whitespace-pre-line leading-7 text-ink/75">
					{data.companyProfile.description}
				</p>

				<p class="mt-4 text-sm text-ink/65">
					Location: {data.companyProfile.location}
				</p>

				{#if data.companyProfile.website}
					<a
						href={data.companyProfile.website}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-3 inline-block font-medium text-tide-deep hover:underline"
					>
						Visit company website →
					</a>
				{/if}
			</section>
		{/if}

		{#if data.isJobSeeker}
			<section class="mt-8 border-t border-white/60 pt-6">
				<h2 class="font-display text-xl font-semibold">Apply for this job</h2>
				<!-- the message stays after invalidateAll reloads alreadyApplied -->
				{#if applicationMessage}
					<p role="status" class="mt-4 rounded-xl bg-emerald-100 p-4 text-emerald-800">
						{applicationMessage}
					</p>
				{:else if data.alreadyApplied}
					<p role="status" class="mt-4 rounded-xl bg-emerald-100 p-4 text-emerald-800">
						You have already applied to this job.
					</p>
				{/if}

				{#if data.outcome}
					<!-- US-03: the recruiter's decision; withdrawing is no longer possible -->
					<div class="mt-4">
						<OutcomeMessage
							status={data.outcome.status}
							message={data.outcome.message}
							nextSteps={data.outcome.nextSteps ?? ''}
							sentAt={data.outcome.createdAt}
						/>
					</div>
				{:else if data.alreadyApplied}
					{#if posting.status === 'open' && posting.published && !data.deadlinePassed}
						<form
							method="POST"
							action="?/withdraw"
							class="mt-4"
							use:enhance={({ cancel }) => {
								// enhance ignores preventDefault, so the confirm cancels the request here
								if (!confirm('Are you sure you want to withdraw your application?')) {
									cancel();
									return;
								}
								submitting = true;
								applicationError = '';
								applicationMessage = '';

								return async ({ result, update }) => {
									submitting = false;

									if (result.type === 'success') {
										applicationMessage =
											(result.data?.success as string) ??
											'Your application has been withdrawn.';
										await invalidateAll();
									} else if (result.type === 'failure') {
										applicationError =
											(result.data?.error as string) ??
											'Unable to withdraw your application.';
									} else {
										await update();
									}
								};
							}}
						>
							{#if applicationError}
								<p role="alert" class="mb-3 text-sm text-rose-700">
									{applicationError}
								</p>
							{/if}

							<button
								type="submit"
								disabled={submitting}
								class="rounded-xl border border-rose-300 px-5 py-3 font-medium text-rose-700 hover:bg-rose-50"
							>
								{submitting ? 'Withdrawing...' : 'Withdraw application'}
							</button>
						</form>
					{/if}
				{:else if posting.status !== 'open' || !posting.published}
					<p class="mt-4 text-ink/65">This job is not accepting applications.</p>
				{:else if data.deadlinePassed}
					<p class="mt-4 text-ink/65">The application deadline has passed.</p>
				{:else if data.resumes.length === 0}
					<p class="mt-4 text-ink/65">
						You need to upload a resume before applying.
						<a href="/resumes" class="font-medium text-tide-deep hover:underline">
							Upload a resume
						</a>
					</p>
				{:else}
					<form
						method="POST"
						action="?/apply"
						class="mt-4 space-y-4"
						use:enhance={() => {
							submitting = true;
							applicationError = '';
							applicationMessage = '';

							return async ({ result, update }) => {
								submitting = false;

								if (result.type === 'success') {
									applicationMessage =
										(result.data?.success as string) ??
										'Application submitted successfully.';
									await invalidateAll();
								} else if (result.type === 'failure') {
									applicationError =
										(result.data?.error as string) ??
										'Unable to submit your application.';
								} else {
									await update();
								}
							};
						}}
					>
						<label for="resumeId" class="block text-sm font-medium">
							Choose your resume
						</label>

						<select
							id="resumeId"
							name="resumeId"
							bind:value={selectedResumeId}
							required
							class="w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3"
						>
							<option value="" disabled>Select a resume</option>
							{#each data.resumes as resume}
								<option value={resume.id}>{resume.fileName}</option>
							{/each}
						</select>

						{#if applicationError}
							<p role="alert" class="text-sm text-rose-700">
								{applicationError}
							</p>
						{/if}

						<button
							type="submit"
							disabled={submitting || !selectedResumeId}
							class={primaryButton + ' px-6'}
						>
							{submitting ? 'Submitting...' : 'Submit application'}
						</button>
					</form>
				{/if}
			</section>
		{/if}


		<p class="mt-8 text-xs text-ink/50">Posted {posting.createdAt.toLocaleDateString()}</p>
	</article>
</div>
