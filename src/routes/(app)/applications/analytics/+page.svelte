<script lang="ts">
    import { APPLICATION_STATUSES } from '$lib/profile-options';
    import { field, glassPanel, label, primaryButton } from '$lib/ui';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
</script>

<svelte:head><title>Application Analytics · CareerConnect</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
    <div>
        <p class="text-sm font-medium uppercase tracking-widest text-tide-deep dark:text-tide">Your job search</p>
        <h1 class="mt-1 font-display text-3xl font-semibold tracking-tight">Application Analytics</h1>
    </div>
    <a href="/applications" class="font-semibold text-tide-deep dark:text-tide underline underline-offset-4">Back to My Applications</a>
</div>

<section class="{glassPanel} mt-6 p-6 sm:p-8" aria-labelledby="activity-heading">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
            <h2 id="activity-heading" class="font-display text-xl font-semibold">Applications over time</h2>
            <p class="mt-1 text-sm text-ink/60">Applications submitted per month over the past 12 months</p>
        </div>
        <p class="text-sm text-ink/60">{data.totalApplications} total</p>
    </div>

    <div class="mt-5 overflow-x-auto">
        <svg
            viewBox="0 0 720 220"
            class="h-auto min-w-[600px] w-full"
            role="img"
            aria-label="Bar chart of applications submitted each month over the past 12 months"
        >
            <line x1="30" y1="165" x2="690" y2="165" stroke="currentColor" class="text-ink/20 dark:text-ink/30" />
            {#each data.months as month, index (month.key)}
                {@const x = 36 + index * 54}
                {@const barHeight = month.count === 0 ? 0 : Math.max(3, (month.count / data.maxMonthlyApplications) * 118)}
                <rect
                    x={x + 12}
                    y={165 - barHeight}
                    width="30"
                    height={barHeight}
                    rx="6"
                    class="fill-tide"
                >
                    <title>{month.label}: {month.count} applications</title>
                </rect>
                {#if month.count > 0}
                    <text x={x + 27} y={157 - barHeight} text-anchor="middle" class="fill-ink/70 dark:fill-ink/90 text-[11px]">
                        {month.count}
                    </text>
                {/if}
                <text x={x + 27} y="190" text-anchor="middle" class="fill-ink/60 dark:fill-ink/80 text-[10px]">
                    {month.label}
                </text>
            {/each}
        </svg>
    </div>
</section>


<section class="mt-6" aria-labelledby="status-heading">
    <h2 id="status-heading" class="font-display text-xl font-semibold">
        Applications by status
    </h2>

    <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {#each data.statusCounts as item (item.status)}
            <article
                class="{glassPanel} p-4
                    {item.status === 'offered'
                        ? 'border-emerald-200 dark:border-emerald-700/40 dark:bg-emerald-950/30'
                        : item.status === 'rejected'
                            ? 'border-rose-200 dark:border-rose-700/40 dark:bg-rose-950/30'
                            : item.status === 'interview'
                                ? 'border-sky-200 dark:border-sky-700/40 dark:bg-sky-950/30'
                                : item.status === 'under_review'
                                    ? 'border-amber-200 dark:border-amber-700/40 dark:bg-amber-950/30'
                                    : 'border-slate-200 dark:border-white/15 dark:bg-white/5'}"
            >
                <p
                    class="text-sm font-semibold
                        {item.status === 'offered'
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : item.status === 'rejected'
                                ? 'text-rose-700 dark:text-rose-300'
                                : item.status === 'interview'
                                    ? 'text-sky-700 dark:text-sky-300'
                                    : item.status === 'under_review'
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-slate-700 dark:text-zinc-300'}"
                >
                    {item.label}
                </p>

                <p class="mt-1 font-display text-2xl font-semibold">
                    {item.count}
                </p>
            </article>
        {/each}
    </div>
</section>


<section class="mt-8" aria-labelledby="history-heading">
    <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
            <h2 id="history-heading" class="font-display text-xl font-semibold">Application history</h2>
            <p class="mt-1 text-sm text-ink/60">
                {data.statusFilter ? `${data.applications.length} matching applications` : 'Your applications, newest first'}
            </p>
        </div>
    </div>

    <form method="get" class="{glassPanel} mt-4 flex flex-wrap items-end gap-3 p-4">
        <label class="block min-w-48 flex-1">
            <span class={label}>Filter by status</span>
            <select name="status" value={data.statusFilter} class={field}>
                <option value="">All statuses</option>
                {#each Object.entries(APPLICATION_STATUSES) as [value, text] (value)}
                    <option {value}>{text}</option>
                {/each}
            </select>
        </label>
        <button type="submit" class={primaryButton + ' px-5 sm:w-auto'}>Apply filter</button>
        {#if data.statusFilter}
            <a href="/applications/analytics#history-heading" class="px-2 py-3 text-sm font-medium text-tide-deep dark:text-tide hover:underline">
                Clear filter
            </a>
        {/if}
    </form>

    {#if data.totalApplications === 0}
        <section class="{glassPanel} mt-4 p-8 text-center">
            <p class="font-medium">You haven't applied to any jobs yet.</p>
            <a href="/jobs" class="mt-4 inline-block font-medium text-tide-deep dark:text-tide hover:underline">Browse job postings</a>
        </section>
    {:else if data.applications.length === 0}
        <section class="{glassPanel} mt-4 p-8 text-center">
            <p class="font-medium">No applications have this status.</p>
            <a href="/applications/analytics#history-heading" class="mt-3 inline-block font-medium text-tide-deep dark:text-tide hover:underline">
                Clear filter
            </a>
        </section>
    {:else}
        <section class="mt-4 space-y-3" aria-label="Filtered application history">
            {#each data.applications as application (application.id)}
                <article class="{glassPanel} p-5 sm:p-6">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 class="font-display text-lg font-semibold">
                                <a href="/jobs/{application.jobPostingId}" class="text-tide-deep dark:text-tide hover:underline">
                                    {application.title}
                                </a>
                            </h3>
                            <p class="mt-1 text-ink/65">{application.company}</p>
                        </div>
                        <span
                            class="inline-flex rounded-full px-3 py-1 text-xs font-semibold
                                {application.status === 'offered'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : application.status === 'rejected'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                        : application.status === 'interview'
                                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                            : application.status === 'under_review'
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-300'}"
                        >
                            {APPLICATION_STATUSES[application.status]}
                        </span>
                    </div>
                    <p class="mt-3 text-sm text-ink/60">Applied {formatDate(application.appliedAt)}</p>
                </article>
            {/each}
        </section>
    {/if}
</section>
