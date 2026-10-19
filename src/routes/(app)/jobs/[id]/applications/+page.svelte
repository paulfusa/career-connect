
<script lang="ts">
    import { glassPanel, primaryButton } from '$lib/ui';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();

    const formatDate = (date: Date) =>
        date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
</script>

<svelte:head>
    <title>Applications · {data.posting.title} · CareerConnect</title>
</svelte:head>

<div class="md:mt-14">
    <a
        href="/jobs/{data.posting.id}"
        class="text-sm font-medium text-tide-deep hover:underline"
    >
        ← Back to job posting
    </a>

    <div class="{glassPanel} mt-5 p-6 sm:p-9">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <p class="text-sm font-medium uppercase tracking-widest text-tide-deep">
                    {data.posting.company}
                </p>
                <h1 class="mt-2 font-display text-3xl font-semibold">
                    Applications
                </h1>
                <p class="mt-2 text-ink/65">{data.posting.title}</p>
            </div>

            <span class="rounded-full bg-white/70 px-4 py-2 text-sm font-medium">
                {data.applicants.length} applicants
            </span>
        </div>

        {#if data.applicants.length === 0}
            <div class="mt-8 rounded-2xl bg-white/60 p-6 text-center">
                <p class="font-medium">No applications yet</p>
                <p class="mt-2 text-sm text-ink/65">
                    Applications will appear here when job seekers apply.
                </p>
            </div>
        {:else}
            <div class="mt-8 space-y-4">
                {#each data.applicants as applicant (applicant.id)}
                    <article class="rounded-2xl border border-white/60 bg-white/60 p-5">
                        <div class="flex flex-wrap items-start justify-between gap-4">
                            <div class="min-w-0">
                                <h2 class="font-display text-lg font-semibold">
                                    {applicant.applicantName}
                                </h2>

                                <p class="mt-1 text-sm text-ink/65">
                                    {applicant.applicantEmail}
                                </p>

                                <p class="mt-2 text-xs text-ink/50">
                                    Applied {formatDate(applicant.appliedAt)}
                                </p>
                            </div>

                            {#if applicant.resumeId && applicant.resumeName}
                                <a
                                    href="/resumes/{applicant.resumeId}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class={primaryButton + ' px-5 text-center sm:w-auto'}
                                >
                                    View resume
                                </a>
                            {:else}
                                <span class="text-sm text-ink/50">
                                    Resume unavailable
                                </span>
                            {/if}
                        </div>

                        {#if applicant.resumeName}
                            <p class="mt-3 text-xs text-ink/60">
                                Resume: {applicant.resumeName}
                            </p>
                        {/if}
                    </article>
                {/each}
            </div>
        {/if}
    </div>
</div>
