<script lang="ts">
    import { APPLICATION_STATUSES } from '$lib/profile-options';
    import { glassPanel } from '$lib/ui';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    let activeStatusLabel = $derived(
        data.status
            ? APPLICATION_STATUSES[data.status as keyof typeof APPLICATION_STATUSES]
            : null
    );
    const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
</script>

<svelte:head><title>My Applications · CareerConnect</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
    <h1 class="font-display text-3xl font-semibold tracking-tight">My Applications</h1>
    <a
        href="/applications/analytics"
        class="rounded-xl border border-white/70 bg-white/60 px-4 py-2.5
            text-center font-semibold text-ink transition hover:bg-white/85
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide
            dark:border-white/15 dark:bg-[#242427] dark:text-white
            dark:hover:bg-[#303034]"
    >
        View analytics and history
    </a>
</div>

{#if activeStatusLabel}
	<div class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tide/20 bg-tide/5 px-4 py-3">
		<p class="text-sm font-medium text-ink">
			Showing applications:
			<span class="font-semibold text-tide-deep dark:text-tide">
				{activeStatusLabel}
			</span>
		</p>

		<a
			href="/applications"
			class="text-sm font-semibold text-tide-deep underline underline-offset-4 hover:text-tide dark:text-tide"
		>
			Show All Applications
		</a>
	</div>
{/if}

{#if data.applications.length === 0}
    <section class="{glassPanel} mt-5 p-8 text-center">

        {#if activeStatusLabel}
            <p class="font-medium">
                No applications with status "{activeStatusLabel}".
            </p>
            <p class="mt-2 text-sm text-ink/60">
                You can view all your applications to see their current statuses.
            </p>
            <a
                href="/applications"
                class="mt-4 inline-block font-medium text-tide-deep hover:underline dark:text-tide"
            >
                Show All Applications
            </a>
        {:else}
            <p class="font-medium">You haven't applied to any jobs yet.</p>
            <a
                href="/jobs"
                class="mt-4 inline-block font-medium text-tide-deep hover:underline dark:text-tide"
            >
                Browse job postings
            </a>
        {/if}

    </section>
{:else}
    <section class="mt-5 space-y-4" aria-label="Your applications">
        {#each data.applications as application (application.id)}
            <article class="{glassPanel} p-6">
                <h2 class="font-display text-xl font-semibold">
                   <a
                        href="/jobs/{application.jobPostingId}"
                        class="text-tide-deep dark:text-tide hover:underline"
                    >
                        {application.title}
                    </a>
                </h2>
                <p class="mt-1 text-ink/65">{application.company}</p>
                <p class="mt-3 text-sm text-ink/65">Applied {formatDate(application.appliedAt)}</p>
                <p class="mt-2 text-sm font-medium">
                    Status:
                    <span
                        class="ml-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold
                            {application.status === 'offered'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : application.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-300'}"
                    >
                        {APPLICATION_STATUSES[application.status]}
                    </span>
                </p>
            </article>
        {/each}
    </section>
{/if}
