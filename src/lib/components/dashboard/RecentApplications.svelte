
<script lang="ts">

type Application = {
	id: string;
	jobPostingId: string;
	jobTitle: string;
	company?: string;
	applicantName?: string;
	status: string;
	createdAt: Date;
};

	let {
		applications,
		role
	}: {
		applications: Application[];
		role: 'job_seeker' | 'recruiter';
	} = $props();

	const statusStyles: Record<string, string> = {
		applied:
			'bg-sky/15 text-sky-800 ring-1 ring-inset ring-sky-500/20 dark:text-sky-200',
		under_review:
			'bg-amber-500/15 text-amber-800 ring-1 ring-inset ring-amber-500/20 dark:text-amber-300',
		interview:
			'bg-lilac/20 text-purple-800 ring-1 ring-inset ring-purple-500/20 dark:text-purple-300',
		offered:
			'bg-green-500/15 text-green-800 ring-1 ring-inset ring-green-500/20 dark:text-green-300',
		rejected:
			'bg-red-500/15 text-red-800 ring-1 ring-inset ring-red-500/20 dark:text-red-300'
	};

	const statusLabels: Record<string, string> = {
		applied: 'Applied',
		under_review: 'Under Review',
		interview: 'Interview',
		offered: 'Offered',
		rejected: 'Rejected'
	};

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-CA', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'America/Toronto'
		}).format(date);
	}
</script>

<section class="overflow-hidden rounded-2xl border border-ink/10 bg-white/70 shadow-sm dark:bg-white/5">
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-5 sm:p-6">
		<div>
			<h2 class="text-xl font-semibold text-ink">Recent Applications</h2>
			<p class="mt-1 text-sm text-ink/60">
				{role === 'recruiter'
					? 'Latest applications to your job postings'
					: 'Your latest application activity'}
			</p>
		</div>

		<a
			href={role === 'recruiter' ? '/jobs?mine' : '/applications'}
			class="text-sm font-semibold text-tide-deep transition hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
		>
			{role === 'recruiter' ? 'View my postings' : 'View all'}
		</a>

	</div>

	{#if applications.length === 0}
		
	<div class="px-6 py-14 text-center">
		<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-tide/10">
			<svg
				class="h-6 w-6 text-tide-deep"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<rect x="3" y="5" width="18" height="15" rx="2" />
				<path d="M8 5V3h8v2M3 11h18M10 15h4" />
			</svg>
		</div>

		<h3 class="font-semibold text-ink">
			{role === 'recruiter' ? 'No applications received yet' : 'No applications yet'}
		</h3>

		<p class="mx-auto mt-2 max-w-sm text-sm text-ink/60">
			{role === 'recruiter'
				? 'When candidates apply to your job postings, their applications will appear here.'
				: 'Start exploring jobs to see your applications here.'}
		</p>

		<a
			href={role === 'recruiter' ? '/jobs/new' : '/jobs'}
			class="mt-5 inline-block rounded-xl bg-tide px-5 py-3 text-sm font-semibold text-white transition hover:bg-tide-deep"
		>
			{role === 'recruiter' ? 'Create a Job Posting' : 'Browse Jobs'}
		</a>
	</div>

	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead class="bg-ink/5 text-xs uppercase tracking-wide text-ink/60">
					<tr>
						<th class="px-3 py-3 sm:px-4 font-semibold">Job Position</th>
						<th class="hidden px-3 py-3 font-semibold sm:table-cell sm:px-4">
							{role === 'recruiter' ? 'Applicant' : 'Company'}
						</th>
						<th class="px-3 py-3 sm:px-4 font-semibold">Status</th>
						<th class="hidden px-3 py-3 font-semibold sm:table-cell sm:px-4">
							Applied
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-ink/10">
					{#each applications as app (app.id)}
						<tr class="transition-colors duration-150 hover:bg-tide/5">
							<td class="px-3 py-3 sm:px-4 font-semibold">
								<a
									href={role === 'recruiter'
										? `/jobs/${app.jobPostingId}/applications`
										: `/jobs/${app.jobPostingId}`}
									class="inline-flex items-center gap-2 text-ink transition-colors hover:text-tide-deep hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
								>
									{app.jobTitle}
									<svg
										class="h-4 w-4 shrink-0 opacity-40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M7 17 17 7M8 7h9v9" />
									</svg>
								</a>
								<p class="mt-1 text-xs font-normal text-ink/60 sm:hidden">
									{app.company ?? app.applicantName ?? '—'}
								</p>
							</td>
							<td class="hidden px-3 py-3 text-sm text-ink/70 sm:table-cell sm:px-4">
								{app.company ?? app.applicantName ?? '—'}
							</td>
							<td class="px-3 py-3 sm:px-4">
								<span
									class={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[app.status] ?? 'bg-ink/10 text-ink'}`}
								>
									{statusLabels[app.status] ?? app.status}
								</span>
							</td>
							<td class="hidden px-3 py-3 text-sm text-ink/60 sm:table-cell sm:px-4">
								{formatDate(app.createdAt)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
