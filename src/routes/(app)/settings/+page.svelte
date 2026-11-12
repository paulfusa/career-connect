
<script lang="ts">
    import { glassPanel } from '$lib/ui';
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { getTheme, setTheme, applyTheme, type Theme } from '$lib/theme';

    let isRecruiter = $derived(
        page.data.user?.role === 'recruiter'
    );

    onMount(() => {
    selectedTheme = getTheme();
    applyTheme(selectedTheme);
    });
    
    let selectedTheme = $state<Theme>('system');

    onMount(() => {
        selectedTheme = getTheme();
    });

    function changeTheme(theme: Theme) {
        selectedTheme = theme;
        setTheme(theme);
    }
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

        
        <!-- US-21: Appearance -->
        <div class="rounded-lg border border-white/40 p-4">
            <h2 class="font-semibold">
                Appearance
            </h2>

            <p class="mt-1 text-sm text-ink/60">
                Choose how CareerConnect looks on your device.
            </p>

            <div class="mt-4 grid gap-3 sm:grid-cols-3">
                {#each [
                    { value: 'light', label: 'Light', icon: '☀' },
                    { value: 'dark', label: 'Dark', icon: '☾' },
                    { value: 'system', label: 'System', icon: '▣' }
                ] as option}
                    <button
                        type="button"
                        aria-pressed={selectedTheme === option.value}
                        onclick={() => changeTheme(option.value as Theme)}
                        class="flex flex-col items-center gap-2 rounded-xl
                            border p-4 text-sm font-medium transition
                            hover:border-tide
                            focus-visible:outline-2 focus-visible:outline-tide
                            {selectedTheme === option.value
                                ? 'border-tide bg-tide/10 text-ink'
                                : 'border-white/40 text-ink/70'}"
                    >
                        <span class="text-2xl" aria-hidden="true">
                            {option.icon}
                        </span>

                        <span>{option.label}</span>
                    </button>
                {/each}
            </div>
        </div>


    </div>
</div>
