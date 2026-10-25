
<script lang="ts">
    import OutcomeForm from '$lib/components/OutcomeForm.svelte';
    import OutcomeMessage from '$lib/components/OutcomeMessage.svelte';
    import { errorBox, glassPanel, primaryButton, successBox } from '$lib/ui';
    import type { PageProps } from './$types';

    let { data, form }: PageProps = $props();

    // like 'Oct 22, 2026, 3:45 p.m. ET', always in Eastern time so the server and the browser show the same time
    const formatDateTime = (date: Date) =>
        `${date.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto' })} ET`;

    // US-03: applications still waiting for a decision after the reminder delay
    let waitingCount = $derived(data.applicants.filter((applicant) => applicant.needsReminder).length);
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

        {#if waitingCount > 0}
            <p role="status" class="mt-6 rounded-2xl bg-amber-100 px-4 py-3 font-medium text-amber-800">
                {waitingCount === 1 ? '1 application is' : `${waitingCount} applications are`} still waiting for your decision.
            </p>
        {/if}

        {#if form?.error && !form?.applicationId}
            <p role="alert" class="{errorBox} mt-6">{form.error}</p>
        {/if}

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
                    <!-- the last form result is only shown on the applicant it was for -->
                    {@const formResult = form?.applicationId === applicant.id ? form : null}
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
                                    Applied {formatDateTime(applicant.appliedAt)}
                                </p>

                                {#if applicant.needsReminder}
                                    <span class="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                                        Waiting for a decision
                                    </span>
                                {/if}
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

                        <!-- US-03: the decision the applicant sees, or the form to send one -->
                        <div class="mt-5 border-t border-white/60 pt-5">
                            {#if formResult?.success}
                                <p role="status" class="{successBox} mb-4">{formResult.success}</p>
                            {/if}

                            {#if applicant.outcome}
                                <OutcomeMessage
                                    status={applicant.outcome.status}
                                    message={applicant.outcome.message}
                                    nextSteps={applicant.outcome.nextSteps ?? ''}
                                    sentAt={applicant.outcome.createdAt}
                                />
                            {:else}
                                {#if formResult?.error}
                                    <p role="alert" class="{errorBox} mb-4">{formResult.error}</p>
                                {/if}

                                <OutcomeForm
                                    action="?/decide"
                                    applicationId={applicant.id}
                                    applicantName={applicant.applicantName}
                                    values={formResult?.values ?? {}}
                                    errors={formResult?.errors}
                                />
                            {/if}
                        </div>
                    </article>
                {/each}
            </div>
        {/if}
    </div>
</div>
