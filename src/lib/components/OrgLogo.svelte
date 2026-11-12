
<script lang="ts">
    import { logoUrl } from '$lib/suggest.svelte';

    // Company/school favicon with initials as fallback
    let {
        name,
        domain,
        size = 'md'
    }: {
        name: string;
        domain?: string | null;
        size?: 'sm' | 'md';
    } = $props();

    let failed = $state(false);

    const box = {
        sm: 'size-9 rounded-lg',
        md: 'size-12 rounded-xl'
    };

    const img = {
        sm: 'size-5',
        md: 'size-7'
    };
</script>

<span
    class="{box[size]} grid shrink-0 place-items-center
           overflow-hidden ring-1
           {domain && !failed
               ? 'bg-white/80 ring-white dark:bg-[#f5f5f5] dark:ring-white/15'
               : 'bg-white/80 ring-white dark:bg-[#303034] dark:ring-white/15'}"
    aria-hidden="true"
>
    {#if domain && !failed}
        <img
            src={logoUrl(domain)}
            alt=""
            class={img[size]}
            onerror={() => (failed = true)}
        />
    {:else}
        <span
            class="font-display font-semibold text-ink/50
                   dark:text-[#7dd3df]
                   {size === 'sm' ? 'text-sm' : 'text-lg'}"
        >
            {name.charAt(0).toUpperCase()}
        </span>
    {/if}
</span>
