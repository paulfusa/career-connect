<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { tick } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { formatNotificationTime, notificationContextIsCurrent, safeNotificationLink } from '$lib/notification-ui';
	import { errorBox, glassPanel, secondaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state<string | null>(null);
	let unavailable = $state(false);
	let clientError = $state<string | null>(null);
	let currentContext = $derived(notificationContextIsCurrent(
		data.notificationOwnerId, data.user.id, data.notificationSessionExpiresAt
	));
	let actionError = $derived(form && 'message' in form ? form.message : null);
	let success = $derived(form && 'success' in form ? form.success : null);

	async function refresh(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		const owner = data.notificationOwnerId;
		busy = 'refresh';
		unavailable = true;
		clientError = null;
		try {
			await invalidate('app:notifications');
			if (owner === data.notificationOwnerId && currentContext) unavailable = false;
			else clientError = 'Your notification session changed. Please sign in again.';
		} catch {
			clientError = 'Notifications are unavailable. Please try refreshing.';
		} finally {
			busy = null;
		}
	}

	const markRead: SubmitFunction = ({ formData, cancel }) => {
		if (busy || !currentContext || unavailable) { cancel(); return; }
		const id = String(formData.get('notificationId') ?? '');
		const owner = data.notificationOwnerId;
		busy = id;
		clientError = null;
		return async ({ result, update }) => {
			try {
				if (result.type === 'redirect') {
					unavailable = true;
					await update({ reset: false }); // preserve the authentication redirect
					return;
				}
				if (owner !== data.notificationOwnerId || !currentContext) {
					unavailable = true;
					clientError = 'Your notification session changed. Please sign in again.';
					return;
				}
				if (result.type === 'error') {
					unavailable = true;
					clientError = 'The notification could not be updated. Please refresh and try again.';
					return;
				}
				// SvelteKit invalidates data once on success. Do not invalidate again.
				await update({ reset: false });
				if (result.type === 'failure' && result.status >= 500) unavailable = true;
				if (result.type === 'success') {
					await tick();
					document.getElementById(`notification-${id}`)?.focus({ preventScroll: true });
				}
			} catch {
				unavailable = true;
				clientError = 'The notification could not be updated. Please refresh and try again.';
			} finally {
				busy = null;
			}
		};
	};
</script>

<svelte:head><title>Notifications · CareerConnect</title></svelte:head>

<div class="space-y-5 md:mt-14">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="font-display text-3xl font-semibold tracking-tight">Notifications</h1>
			<p class="mt-2 text-sm text-ink/70">Showing the latest 50 notifications. Older notifications are not yet accessible.</p>
			{#if currentContext}
				<p class="mt-1 text-sm text-ink/60">
					{data.notificationUnreadCount === null ? 'Unread count unavailable.' : `${data.notificationUnreadCount} unread in total, including older notifications.`}
				</p>
			{/if}
		</div>
		<form method="get" action="/notifications" data-sveltekit-reload onsubmit={refresh}>
			<button type="submit" disabled={busy !== null} class="{secondaryButton} min-h-11">
				{busy === 'refresh' ? 'Refreshing…' : 'Refresh'}
			</button>
		</form>
	</div>

	<div aria-live="polite">
		{#if !currentContext}
			<p role="alert" class={errorBox}>Your notification session is unavailable. <a href="/login" class="font-semibold underline">Sign in again</a>.</p>
		{:else if clientError || actionError}
			<p role="alert" class={errorBox}>{clientError || actionError}</p>
		{:else if success}
			<p role="status" class={successBox}>{success}</p>
		{/if}
	</div>

	{#if currentContext}
		<section class="{glassPanel} p-5 sm:p-7" aria-label="Your notifications" aria-busy={busy !== null}>
			{#if busy === 'refresh'}
				<p role="status" class="text-ink/65">Loading notifications…</p>
			{:else if unavailable || data.notifications === null}
				<p role="alert" class={errorBox}>{data.notificationLoadError || 'Notifications are unavailable. Please try refreshing.'}</p>
			{:else if data.notifications.length === 0}
				<p class="font-medium">No notifications yet.</p>
				<p class="mt-2 text-sm text-ink/60">Updates for your account will appear here.</p>
			{:else}
				<ul class="space-y-4">
					{#each data.notifications as notification (notification.id)}
						{@const link = safeNotificationLink(notification.link)}
						<li>
							<article
								id="notification-{notification.id}"
								tabindex="-1"
								aria-labelledby="notification-title-{notification.id}"
								class="min-w-0 rounded-2xl border p-4 focus:outline-2 focus:outline-offset-2 focus:outline-tide sm:p-5 {notification.readAt === null ? 'border-tide/35 bg-white/75' : 'border-white/60 bg-white/35'}"
							>
								<div class="flex flex-wrap items-start justify-between gap-2">
									<h2 id="notification-title-{notification.id}" class="min-w-0 break-words font-display text-lg font-semibold [overflow-wrap:anywhere]">{notification.title}</h2>
									<span class="shrink-0 rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold text-ink/75">{notification.readAt === null ? 'Unread' : 'Read'}</span>
								</div>
								<p class="mt-2 whitespace-pre-wrap break-words text-ink/80 [overflow-wrap:anywhere]">{notification.message}</p>
								<time datetime={notification.createdAt.toISOString()} class="mt-3 block text-xs text-ink/60">{formatNotificationTime(notification.createdAt)}</time>
								<div class="mt-4 flex flex-wrap items-center gap-3">
									{#if link}
										<a href={link} data-sveltekit-preload-data="off" class="inline-flex min-h-11 items-center rounded-lg px-2 font-semibold text-tide hover:underline focus-visible:outline-2 focus-visible:outline-tide">View related page</a>
									{/if}
									{#if notification.readAt === null}
										<form method="post" action="?/markRead" use:enhance={markRead}>
											<input type="hidden" name="notificationId" value={notification.id} />
											<button type="submit" disabled={busy !== null} aria-label="Mark as read: {notification.title}" class="{secondaryButton} min-h-11 text-sm">
												{busy === notification.id ? 'Marking as read…' : 'Mark as read'}
											</button>
										</form>
									{/if}
								</div>
							</article>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>
