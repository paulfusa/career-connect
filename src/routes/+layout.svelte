
<script lang="ts">
    import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { onNavigate } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getTheme, applyTheme } from '$lib/theme';

    let { children } = $props();

    // US-21: Apply the saved theme on every page
    onMount(() => {
        applyTheme(getTheme());

        // Follow device appearance changes when System is selected
        const media = window.matchMedia('(prefers-color-scheme: dark)');

        const handleSystemChange = () => {
            if (getTheme() === 'system') {
                applyTheme('system');
            }
        };

        media.addEventListener('change', handleSystemChange);

        return () => {
            media.removeEventListener('change', handleSystemChange);
        };
    });

    // Existing page transitions
    onNavigate((navigation) => {
        if (!document.startViewTransition || document.hidden) return;

        if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
