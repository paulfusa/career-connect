<script lang="ts">
    import { APPLICATION_STATUSES } from '$lib/profile-options';
    import { glassPanel } from '$lib/ui';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
</script>

<svelte:head><title>My Applications · CareerConnect</title></svelte:head>

<h1 class="font-display text-3xl font-semibold tracking-tight md:mt-14">My Applications</h1>

{#if data.applications.length === 0}
    <section class="{glassPanel} mt-5 p-8 text-center">
        <p class="font-medium">You haven't applied to any jobs yet.</p>
        <a href="/jobs" class="mt-4 inline-block font-medium text-tide-deep hover:underline">Browse job postings</a>
    </section>
{:else}
    <section class="mt-5 space-y-4" aria-label="Your applications">
        {#each data.applications as application (application.id)}
            <article class="{glassPanel} p-6">
                <h2 class="font-display text-xl font-semibold">
                    <a href="/jobs/{application.jobPostingId}" class="text-tide-deep hover:underline">{application.title}</a>
                </h2>
                <p class="mt-1 text-ink/65">{application.company}</p>
                <p class="mt-3 text-sm text-ink/65">Applied {formatDate(application.appliedAt)}</p>
                <p class="mt-2 text-sm font-medium">Status: {APPLICATION_STATUSES[application.status]}</p>
            </article>
        {/each}
    </section>
{/if}
