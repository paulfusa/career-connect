
<script lang="ts">
    import { glassPanel } from '$lib/ui';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Company Profile · CareerConnect</title>
</svelte:head>

<div class="space-y-5 md:mt-14">
    <div>
        <h1 class="font-display text-2xl font-semibold">
            Company Profile
        </h1>
        <p class="mt-2 text-sm text-ink/60">
            View and manage your company's public information.
        </p>
    </div>

    {#if data.company}
        <div class="{glassPanel} overflow-hidden">

            <!-- Profile cover -->
            <div class="h-36 bg-gradient-to-r from-sky-200/70 to-teal-200/60"></div>

            <div class="space-y-6 p-6">

                <!-- Company identity -->
                <div class="flex flex-wrap items-end justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-sm">
                            <span class="font-display text-3xl font-bold text-slate-700">
                                {data.company.name.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div>
                            <h2 class="font-display text-2xl font-semibold">
                                {data.company.name}
                            </h2>
                            <p class="mt-1 text-sm text-ink/60">
                                {data.company.location}
                            </p>
                        </div>
                    </div>

                </div>

                <!-- Company information -->
                <div class="border-t border-white/60 pt-6">
                    <h3 class="font-display text-lg font-semibold">
                        About Us
                    </h3>

                    <p class="mt-3 whitespace-pre-line leading-7 text-ink/75">
                        {data.company.description}
                    </p>
                </div>

                <!-- Website -->
                {#if data.company.website}
                    <div class="border-t border-white/60 pt-6">
                        <h3 class="font-display text-lg font-semibold">
                            Website
                        </h3>

                        <a
                            href={data.company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="mt-2 inline-block font-medium text-tide-deep hover:underline"
                        >
                            {data.company.website}
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
                
                <div class="border-t border-white/60 pt-5 text-center">
                    <a
                        href="/company/edit"
                        class="text-sm font-medium text-tide-deep transition hover:underline"
                    >
                        Edit Company Profile
                    </a>
                </div>

            </div>
        </div>
   
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
