<script lang="ts">
	let { unreadCount, current = false }: { unreadCount: number | null; current?: boolean } = $props();
	let accessibleLabel = $derived(unreadCount === null
		? 'Notifications, unread count unavailable'
		: `Notifications, ${unreadCount} unread`);
</script>

<a
	href="/notifications"
	data-sveltekit-reload
	data-sveltekit-preload-data="off"
	aria-current={current ? 'page' : undefined}
	aria-label={accessibleLabel}
	class="flex min-h-11 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-white/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide aria-[current=page]:bg-white/75 aria-[current=page]:text-ink md:flex-none"
>
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="size-5 shrink-0" aria-hidden="true">
		<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
	<span>Notifications</span>
	{#if unreadCount === null || unreadCount > 0}
		<span aria-hidden="true" class="ml-auto rounded-full bg-tide px-2 py-0.5 text-xs font-semibold text-white">
			{unreadCount === null ? '?' : unreadCount > 99 ? '99+' : unreadCount}
		</span>
	{/if}
</a>
