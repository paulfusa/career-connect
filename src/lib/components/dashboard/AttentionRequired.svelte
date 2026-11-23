
<script lang="ts">
	type Deadline = {
		id: string;
		title: string;
		applicationDeadline: string | null;
	};

    let {
        role,
        awaitingReview = 0,
        upcomingDeadlines = [],
        interviews = 0,
        offers = 0
    }: {
        role: 'job_seeker' | 'recruiter';
        awaitingReview?: number;
        upcomingDeadlines?: Deadline[];
        interviews?: number;
        offers?: number;
    } = $props();

	const formatDate = (date: string) => {
		const [year, month, day] = date.split('-').map(Number);

		return new Intl.DateTimeFormat('en-CA', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(Date.UTC(year, month - 1, day, 12)));
	};
</script>

<section class="overflow-hidden rounded-2xl border border-ink/10 bg-white/70 shadow-sm dark:bg-white/5">
	<div class="border-b border-ink/10 px-5 py-5 sm:px-6">
		<h2 class="text-xl font-semibold text-ink">
			Attention Required
		</h2>
		<p class="mt-1 text-sm text-ink/60">
			Items that may need your attention
		</p>
	</div>

	<div class="space-y-3 p-5 sm:p-6">
		{#if role === 'job_seeker'}
			{#if interviews > 0}
				<a
					href="/applications"
					class="flex items-center justify-between gap-4 rounded-xl border border-ink/10 p-4 transition hover:border-tide/40 hover:bg-tide/5"
				>
					<div>
						<p class="font-semibold text-ink">Interviews</p>
						<p class="mt-1 text-sm text-ink/60">
							You have {interviews} application{interviews === 1 ? '' : 's'} in the interview stage.
						</p>
					</div>
					<span class="shrink-0 rounded-full bg-lilac/20 px-3 py-1 text-sm font-bold text-ink">
						{interviews}
					</span>
				</a>
			{/if}

			{#if offers > 0}
				<a
					href="/applications"
					class="flex items-center justify-between gap-4 rounded-xl border border-ink/10 p-4 transition hover:border-tide/40 hover:bg-tide/5"
				>
					<div>
						<p class="font-semibold text-ink">Job Offers</p>
						<p class="mt-1 text-sm text-ink/60">
							You have {offers} job offer{offers === 1 ? '' : 's'} to view.
						</p>
					</div>
					<span class="shrink-0 rounded-full bg-green-500/15 px-3 py-1 text-sm font-bold text-green-700 dark:text-green-300">
						{offers}
					</span>
				</a>
			{/if}

			{#if interviews === 0 && offers === 0}
				<div class="py-8 text-center">
					<p class="font-semibold text-ink">You're all caught up!</p>
					<p class="mt-2 text-sm text-ink/60">
						No interviews or job offers to highlight right now.
					</p>
				</div>
			{/if}
		{:else}
			{#if awaitingReview > 0}
				<a
					href="/jobs?mine"
					class="flex items-center justify-between gap-4 rounded-xl border border-ink/10 p-4 transition hover:border-tide/40 hover:bg-tide/5"
				>
					<div>
						<p class="font-semibold text-ink">Applications awaiting review</p>
						<p class="mt-1 text-sm text-ink/60">
							You have {awaitingReview} application{awaitingReview === 1 ? '' : 's'} to review.
						</p>
					</div>
					<span class="shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-300">
						{awaitingReview}
					</span>
				</a>
			{/if}

			{#each upcomingDeadlines as deadline (deadline.id)}
				<a
					href={`/jobs/${deadline.id}`}
					class="block rounded-xl border border-ink/10 p-4 transition hover:border-tide/40 hover:bg-tide/5"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-semibold text-ink">
								{deadline.title}
							</p>
							<p class="mt-1 text-sm text-ink/60">
								Application deadline approaching
							</p>
						</div>

						{#if deadline.applicationDeadline}
							<span class="shrink-0 rounded-lg bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-700 dark:text-orange-300">
								{formatDate(deadline.applicationDeadline)}
							</span>
						{/if}
					</div>
				</a>
			{/each}

			{#if awaitingReview === 0 && upcomingDeadlines.length === 0}
				<div class="py-8 text-center">
					<p class="font-semibold text-ink">You're all caught up!</p>
					<p class="mt-2 text-sm text-ink/60">
						No applications awaiting review or upcoming deadlines.
					</p>
				</div>
			{/if}
		{/if}
	</div>
</section>
