
<script lang="ts">
    import Stars from '$lib/components/Stars.svelte';
    import { glassPanel } from '$lib/ui';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Company Profile · CareerConnect</title>
</svelte:head>

<div class="space-y-5">
    <div>
        <h1 class="font-display text-2xl font-semibold">
            Company Profile
        </h1>
        <p class="mt-2 text-sm text-ink/60">
            View and manage your companies' public information.
        </p>
    </div>

    <!-- US-34: a recruiter can have several companies -->
    {#if data.companies.length > 0}
        {#each data.companies as company (company.id)}
        <div class="{glassPanel} overflow-hidden">

            <!-- Profile cover -->
            <div class="h-36 bg-gradient-to-r from-sky-200/70 to-teal-200/60"></div>

            <div class="space-y-6 p-6">

                <!-- Company identity -->
                <div class="flex flex-wrap items-end justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-sm">
                            <span class="font-display text-3xl font-bold text-slate-700">
                                {company.name.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div>
                            <h2 class="font-display text-2xl font-semibold">
                                {company.name}
                            </h2>
                            <p class="mt-1 text-sm text-ink/60">
                                {company.location}
                            </p>
                            <!-- US-09: your stars, click to see the reviews -->
                            <a href="/companies/{company.slug}" class="mt-1 inline-flex items-center gap-1.5 text-sm text-ink/65 hover:underline">
                                {#if company.rating}
                                    <Stars rating={company.rating.average} />
                                    {company.rating.average.toFixed(1)} · {company.rating.count} {company.rating.count === 1 ? 'review' : 'reviews'}
                                {:else}
                                    No reviews yet
                                {/if}
                            </a>
                        </div>
                    </div>

                </div>

                <!-- Company information -->
                <div class="border-t border-white/60 pt-6">
                    <h3 class="font-display text-lg font-semibold">
                        About Us
                    </h3>

                    <p class="mt-3 whitespace-pre-line leading-7 text-ink/75">
                        {company.description}
                    </p>
                </div>

                <!-- Website -->
                {#if company.website}
                    <div class="border-t border-white/60 pt-6">
                        <h3 class="font-display text-lg font-semibold">
                            Website
                        </h3>

                        <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="mt-2 inline-block font-medium text-tide-deep hover:underline"
                        >
                            {company.website}
                        </a>
                    </div>
                {/if}

                <!-- Future job postings -->
                <div class="border-t border-white/60 pt-6">
                    <h3 class="font-display text-lg font-semibold">
                        Open Positions
                    </h3>
                    <p class="mt-2 text-sm text-ink/60">
                        Company job opportunities will appear here.
                    </p>
                </div>
                
                <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-white/60 pt-5">
                    <a
                        href="/company/edit?id={company.id}"
                        class="text-sm font-medium text-tide-deep transition hover:underline"
                    >
                        Edit Company Profile
                    </a>
                    <!-- US-09: the page job seekers see, with the reviews -->
                    <a
                        href="/companies/{company.slug}"
                        class="text-sm font-medium text-tide-deep transition hover:underline"
                    >
                        See your company page and reviews
                    </a>
                </div>

            </div>
        </div>
        {/each}

        <a href="/company/edit" class="inline-block text-sm font-medium text-tide-deep hover:underline dark:text-tide">
            + Add another company
        </a>

{:else}
    <div class="{glassPanel} space-y-4 p-6">
        <p class="text-sm text-ink/60">
            You haven't created a company profile yet.
            Create one to showcase your company and attract top talent.
        </p>

        <a
            href="/company/edit"
            class="inline-block text-sm font-medium text-tide-deep hover:underline"
        >
            Create Company Profile →
        </a>
    </div>
{/if}


</div>
