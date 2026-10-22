
<script lang="ts">
    import { glassPanel } from '$lib/ui';
    import { page } from '$app/state';

    let isRecruiter = $derived(
        page.data.user?.role === 'recruiter'
    );
</script>

<svelte:head>
    <title>Settings · CareerConnect</title>
</svelte:head>

<div class="space-y-5 md:mt-14">
    <div>
        <h1 class="font-display text-2xl font-semibold">
            Settings
        </h1>
        <p class="mt-2 text-sm text-ink/60">
            Manage your account and application preferences.
        </p>
    </div>

    <div class="{glassPanel} space-y-4 p-6">

        <!-- Personal Information -->
        <a
            href="/profile"
            class="block rounded-lg border border-white/40 p-4 transition hover:bg-white/20"
        >
            <h2 class="font-semibold">
                Personal Information →
            </h2>
            <p class="mt-1 text-sm text-ink/60">
                View or update your personal details and profile information.
            </p>
        </a>

        <!-- Company Profile (Recruiters only) -->
        {#if isRecruiter}
            <a
                href="/company"
                class="block rounded-lg border border-white/40 p-4 transition hover:bg-white/20"
            >
                <h2 class="font-semibold">
                    Company Profile →
                </h2>
                <p class="mt-1 text-sm text-ink/60">
                    Create or edit your company information.
                </p>
            </a>
        {/if}

        <!-- Appearance -->
        <div class="rounded-lg border border-white/40 p-4 opacity-60">
            <h2 class="font-semibold">
                Appearance
            </h2>
            <p class="mt-1 text-sm text-ink/60">
                Theme preferences — coming soon.
            </p>
        </div>

    </div>
</div>
