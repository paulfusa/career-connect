<script lang="ts">
	import { afterNavigate, preloadData } from '$app/navigation';
	import { notificationContextIsCurrent, safeNotificationLink, type NotificationItem } from '$lib/notification-ui';
	import type { PageData } from '../../routes/(app)/notifications/$types';

	let { unreadCount, ownerId, contextValid = true }: { unreadCount: number | null; ownerId: string; contextValid?: boolean } = $props();
	const id = $props.id();
	let open = $state(false);
	let loading = $state(false);
	let notifications = $state<NotificationItem[] | null>(null);
	let container: HTMLDivElement;
	let trigger: HTMLButtonElement;
	let requestVersion = 0;
	let accessibleLabel = $derived(unreadCount === null
		? 'Notifications, unread count unavailable'
		: `Notifications, ${unreadCount} unread`);

	function close(restoreFocus = false) {
		open = false;
		loading = false;
		notifications = null;
		requestVersion++;
		if (restoreFocus) trigger.focus();
	}

	$effect(() => {
		if (!contextValid) close();
	});
	afterNavigate(() => close());

	async function toggle() {
		if (open) { close(); return; }
		open = true;
		notifications = null;
		if (!contextValid) return;
		loading = true;
		const version = ++requestVersion;
		try {
			// Reuse the inbox loader. A unique URL avoids SvelteKit's preload cache
			// when reopening from another page; on the inbox it uses current page data.
			const result = await preloadData(`/notifications?preview=${Date.now()}`);
			if (version !== requestVersion || !contextValid) return;
			if (result.type !== 'loaded' || result.status !== 200) return;
			const data = result.data as PageData;
			if (!notificationContextIsCurrent(data.notificationOwnerId, ownerId, data.notificationSessionExpiresAt)) return;
			notifications = data.notifications?.slice(0, 5) ?? null;
		} catch {
			// Keep the inbox link available when the preview cannot be loaded.
		} finally {
			if (version === requestVersion) loading = false;
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			event.preventDefault();
			close(true);
		}
	}
</script>

<svelte:window
	onkeydown={onKeydown}
	onpointerdown={(event) => { if (open && !container.contains(event.target as Node)) close(); }}
/>

<div bind:this={container} class="relative shrink-0" onfocusout={(event) => {
	if (open && event.relatedTarget && !container.contains(event.relatedTarget as Node)) close();
}}>
	<button
		bind:this={trigger}
		type="button"
		onclick={toggle}
		aria-label={accessibleLabel}
		aria-expanded={open}
		aria-controls="notification-preview-{id}"
		class="flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2 text-ink/70 transition hover:bg-white/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="size-5 shrink-0" aria-hidden="true">
			<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		{#if unreadCount === null || unreadCount > 0}
			<span aria-hidden="true" class="rounded-full bg-tide px-2 py-0.5 text-xs font-semibold text-white">
				{unreadCount === null ? '?' : unreadCount > 99 ? '99+' : unreadCount}
			</span>
		{/if}
	</button>

	<section
		id="notification-preview-{id}"
		hidden={!open}
		aria-label="Latest notifications"
		class="absolute right-0 top-full mt-2 max-h-[min(28rem,calc(100dvh-8rem))] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-ink/10 bg-white shadow-xl"
	>
		<div class="flex items-center justify-between gap-2 border-b border-ink/10 px-4 py-2">
			<h2 class="font-display font-semibold">Notifications</h2>
			<button type="button" onclick={() => close(true)} aria-label="Close notifications" class="min-h-11 min-w-11 rounded-lg text-xl text-ink/60 hover:bg-mist focus-visible:outline-2 focus-visible:outline-tide">×</button>
		</div>
		<div aria-live="polite" aria-busy={loading}>
			{#if !contextValid}
				<p class="p-4 text-sm">Your notification session is unavailable. <a href="/login" class="font-semibold text-tide underline">Sign in again</a>.</p>
			{:else if loading}
				<p class="p-4 text-sm text-ink/65">Loading notifications…</p>
			{:else if notifications === null}
				<p class="p-4 text-sm text-ink/65">Notifications are unavailable. Please try again.</p>
			{:else if notifications.length === 0}
				<p class="p-4 text-sm text-ink/65">No notifications yet.</p>
			{:else}
				<ul class="divide-y divide-ink/10">
					{#each notifications as notification (notification.id)}
						{@const link = safeNotificationLink(notification.link)}
						<li class="p-4 {notification.readAt === null ? 'bg-tide/5' : ''}">
							<p class="break-words text-sm font-semibold [overflow-wrap:anywhere]">{notification.title}</p>
							<div class="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
								<span class="text-ink/65">{notification.readAt === null ? 'Unread' : 'Read'}</span>
								{#if link}
									<a href={link} data-sveltekit-preload-data="off" aria-label="View related page: {notification.title}" class="inline-flex min-h-11 items-center rounded-lg font-semibold text-tide hover:underline focus-visible:outline-2 focus-visible:outline-tide">View related page</a>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		<a href="/notifications" data-sveltekit-reload data-sveltekit-preload-data="off" class="flex min-h-11 items-center justify-center border-t border-ink/10 px-4 py-3 text-sm font-semibold text-tide hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-tide">View all notifications</a>
	</section>
</div>
