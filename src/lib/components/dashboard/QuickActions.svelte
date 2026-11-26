
<script lang="ts">
	let {
		role
	}: {
		role: 'job_seeker' | 'recruiter';
	} = $props();

	const actions = {
		job_seeker: [
			{
				title: 'Browse Jobs',
				description: 'Discover new career opportunities',
				href: '/jobs',
				icon: 'search'
			},
			{
				title: 'My Applications',
				description: 'Track your application progress',
				href: '/applications',
				icon: 'document'
			},
			{
				title: 'My Resumes',
				description: 'Manage your uploaded resumes',
				href: '/resumes',
				icon: 'profile'
			}
		],
		recruiter: [
			{
				title: 'Create Job Posting',
				description: 'Find candidates for a new position',
				href: '/jobs/new',
				icon: 'plus'
			},
			{
				title: 'My Job Postings',
				description: 'Manage your published positions',
				href: '/jobs?mine',
				icon: 'document'
			},
            {
				title: 'Review Applications',
				description: 'Review candidates who applied to your job postings',
				href: '/jobs?mine&appStatus=all',
				icon: 'users'
			}

		]
	};

	let selectedActions = $derived(actions[role]);
</script>

<section class="mt-8">
	<div class="mb-5">
		<h2 class="text-xl font-semibold text-ink">Quick Actions</h2>
		<p class="mt-1 text-sm text-ink/60">
			Shortcuts to the tools you use most
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each selectedActions as action (action.title)}
			<a
				href={action.href}
					class="group flex min-w-0 items-center gap-3 rounded-2xl border border-ink/10
						bg-white/70 p-4 shadow-sm transition-all duration-200 sm:gap-4 sm:p-5
					hover:-translate-y-1 hover:border-tide/40 hover:shadow-lg
					focus-visible:outline-2 focus-visible:outline-offset-2
					focus-visible:outline-tide dark:bg-white/5"
			>
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
						bg-tide/10 text-tide-deep transition group-hover:bg-tide/20"
				>
					{#if action.icon === 'plus'}
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path d="M12 5v14M5 12h14" stroke-linecap="round" />
						</svg>
					{:else if action.icon === 'search'}
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<circle cx="10.5" cy="10.5" r="6.5" />
							<path d="m16 16 5 5" stroke-linecap="round" />
						</svg>
					{:else if action.icon === 'chart'}
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path d="M4 20V11M10 20V5M16 20v-8M22 20V8" stroke-linecap="round" />
						</svg>
					{:else if action.icon === 'profile'}
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path d="M7 3h7l5 5v13H7zM14 3v6h5M10 13h6M10 17h6" stroke-linejoin="round" />
						</svg>
					{:else}
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<rect x="4" y="3" width="16" height="18" rx="2" />
							<path d="M8 8h8M8 12h8M8 16h5" stroke-linecap="round" />
						</svg>
					{/if}
				</div>

				<div class="min-w-0 flex-1">
					<h3 class="font-semibold text-ink transition-colors group-hover:text-tide-deep">
						{action.title}
					</h3>
					<p class="mt-1 wrap-anywhere text-sm text-ink/60">
						{action.description}
					</p>
				</div>

				<span class="text-lg text-ink/40 transition group-hover:translate-x-1 group-hover:text-tide-deep" aria-hidden="true">
					→
				</span>
			</a>
		{/each}
	</div>
</section>
