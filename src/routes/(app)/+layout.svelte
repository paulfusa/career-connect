<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import Backdrop from '$lib/components/Backdrop.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import { notificationContextIsCurrent } from '$lib/notification-ui';
	import { glassPanel } from '$lib/ui';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let signingOutUserId = $state<string | null>(null);
	let sessionExpired = $state(false);
	let notificationContextValid = $derived(signingOutUserId !== data.user.id && !sessionExpired && notificationContextIsCurrent(
		data.notificationOwnerId, data.user.id, data.notificationSessionExpiresAt
	));

	$effect(() => {
		// Cancel stale timers when fresh server session data arrives.
		const expiresAt = data.notificationSessionExpiresAt;
		sessionExpired = expiresAt !== null && expiresAt.getTime() <= Date.now();
		if (expiresAt === null) return;
		// Recheck long sessions in bounded timer intervals (no network polling).
		let timer = 0;
		function checkExpiry() {
			const remaining = expiresAt!.getTime() - Date.now();
			if (remaining <= 0) { sessionExpired = true; return; }
			timer = window.setTimeout(checkExpiry, Math.min(remaining, 2_147_000_000));
		}
		checkExpiry();
		return () => window.clearTimeout(timer);
	});

	const roleLabel = { job_seeker: 'Job seeker', recruiter: 'Recruiter' };
	let nav = $derived([
		{ href: '/', label: 'Home' },
		{ href: '/jobs', label: 'Jobs' },
		...(data.user.role === 'job_seeker' ? [{ href: '/resumes', label: 'Resumes' }] : []),
		...(data.user.role === 'job_seeker' ? [{ href: '/applications', label: 'My Applications' }] : []),
		// US-19: job seekers find recruiters here and recruiters find job seekers
		{ href: '/people', label: data.user.role === 'job_seeker' ? 'Recruiters' : 'Job seekers' },
		{ href: '/following', label: 'Following' },
		{ href: '/settings', label: 'Settings' }
	]);

	let tagline = $derived(
		data.user.role === 'recruiter'
			? [data.profile?.jobTitle, data.profile?.company].filter(Boolean).join(' at ')
			: data.profile?.headline
	);
</script>

<Backdrop />

{#key data.user.id}
<div class="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[17rem_minmax(0,1fr)] md:gap-8 md:py-10">
	<header class="relative z-20 col-span-full flex min-w-0 items-center justify-between gap-3">
		<a href="/" class="min-w-0 font-display text-2xl font-semibold tracking-tight">
			Career<span class="text-tide">Connect</span>
		</a>
		<NotificationBell
			unreadCount={notificationContextValid ? data.notificationUnreadCount : null}
			ownerId={data.user.id}
			contextValid={notificationContextValid}
		/>
	</header>

	<aside class="app-sidebar md:sticky md:top-10 md:self-start">
		<section class="{glassPanel} p-5">
			<div class="flex items-center gap-4 md:flex-col md:items-start">
				<Avatar name={data.user.name} image={data.user.image} />
				<div class="min-w-0">
					<p class="truncate font-display text-lg font-semibold">{data.user.name}</p>
					<p class="text-sm text-ink/60">{tagline || roleLabel[data.user.role]}</p>
					{#if data.profile?.location}
						<p class="mt-0.5 text-sm text-ink/50">{data.profile.location}</p>
					{/if}
				</div>
			</div>

			<nav aria-label="Main navigation" class="mt-5 flex flex-wrap gap-1 md:flex-col">
				{#each nav as item (item.href)}
					<a
						href={item.href}
						aria-current={
							page.url.pathname === item.href ||
							(item.href === '/jobs' && page.url.pathname.startsWith('/jobs'))
								? 'page'
								: undefined
						}
						class="flex-1 rounded-xl px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-white/60 hover:text-ink aria-[current=page]:bg-white/75 aria-[current=page]:text-ink md:flex-none"
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<form method="post" action="/logout" onsubmit={() => { signingOutUserId = data.user.id; }} class="mt-4 border-t border-white/60 pt-4">
				<button
					class="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink/60 transition hover:bg-white/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-tide"
				>
					Log out
				</button>
			</form>
		</section>
	</aside>

	<main class="min-w-0">
		{#if !notificationContextValid && page.url.pathname === '/notifications'}
			<p role="alert" class="rounded-xl bg-white/70 p-5">Your notification session is unavailable. <a href="/login" class="font-semibold text-tide underline">Sign in again</a>.</p>
		{:else}
			{@render children()}
		{/if}
	</main>
</div>
{/key}
