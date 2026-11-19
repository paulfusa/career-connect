<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import Backdrop from '$lib/components/Backdrop.svelte';
	import Icon, { type IconName } from '$lib/components/Icon.svelte';
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
	let nav = $derived<{ href: string; label: string; icon: IconName }[]>([
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/jobs', label: 'Jobs', icon: 'briefcase' },
		...(data.user.role === 'job_seeker'
			? [
					{ href: '/resumes', label: 'Resumes', icon: 'file' as const },
					{ href: '/applications', label: 'My Applications', icon: 'send' as const }
				]
			: []),
		// US-19: job seekers find recruiters here and recruiters find job seekers
		{ href: '/people', label: data.user.role === 'job_seeker' ? 'Recruiters' : 'Job seekers', icon: 'users' },
		{ href: '/following', label: 'Following', icon: 'userCheck' },
		// US-06: suggestions for everyone, review page for admins
		{ href: '/suggestions', label: 'Suggest a feature', icon: 'lightbulb' },
		...(data.user.isAdmin ? [{ href: '/suggestions/review', label: 'Review suggestions', icon: 'clipboardCheck' as const }] : []),
		{ href: '/settings', label: 'Settings', icon: 'settings' }
	]);

	// one style for every sidebar row; the current page gets a tinted background and a teal icon
	const navItem =
		'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink/70 transition ' +
		'hover:bg-white/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-tide ' +
		'aria-[current=page]:bg-white/80 aria-[current=page]:text-ink aria-[current=page]:shadow-sm aria-[current=page]:shadow-ink/5 ' +
		'dark:hover:bg-white/10 dark:hover:text-white dark:aria-[current=page]:bg-white/12 dark:aria-[current=page]:text-white';
	const navIcon =
		'size-[18px] text-ink/45 transition group-hover:text-ink/70 group-aria-[current=page]:text-tide ' +
		'dark:text-white/45 dark:group-hover:text-white/75 dark:group-aria-[current=page]:text-[#7dd3df]';

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

			<nav aria-label="Main navigation" class="mt-5 grid gap-1 min-[360px]:grid-cols-2 md:flex md:flex-col">
				{#each nav as item (item.href)}
					<a
						href={item.href}
						aria-current={
							page.url.pathname === item.href ||
							(item.href === '/jobs' && page.url.pathname.startsWith('/jobs'))
								? 'page'
								: undefined
						}
							class={navItem}
					>
						<Icon name={item.icon} class={navIcon} />
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- US-06: admin view switch -->
			{#if data.user.isAdmin}
				<form method="POST" action="/view-as" class="mt-4 border-t border-white/60 pt-4 dark:border-white/15">
					<p id="view-as-label" class="px-1 text-xs font-semibold uppercase tracking-wide text-ink/50">View as</p>
					<div role="group" aria-labelledby="view-as-label" class="mt-2 grid grid-cols-2 gap-1">
						{#each [['job_seeker', 'Job seeker'], ['recruiter', 'Recruiter']] as [value, text] (value)}
							<button
								type="submit"
								name="role"
								{value}
								aria-pressed={data.user.role === value}
								class="rounded-xl px-2 py-2 text-sm font-medium text-ink/70 transition
									hover:bg-white/60 hover:text-ink
									aria-pressed:bg-white/75 aria-pressed:text-ink
									dark:hover:bg-white/10 dark:aria-pressed:bg-white/12 dark:aria-pressed:text-white
									focus-visible:outline-2 focus-visible:outline-tide"
							>
								{text}
							</button>
						{/each}
					</div>
				</form>
			{/if}


<form
    method="post"
    action="/logout"
    onsubmit={() => { signingOutUserId = data.user.id; }}
    class="mt-4 border-t border-white/60 pt-4 dark:border-white/15"
>

				<button
					type="submit"
					class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm
						font-medium text-ink/60 transition
						hover:bg-rose-50/80 hover:text-rose-700
						dark:hover:bg-rose-950/40 dark:hover:text-rose-300
						focus-visible:outline-2 focus-visible:outline-tide"
				>
					<Icon name="logOut" class="size-[18px] text-ink/40 transition group-hover:text-rose-600 dark:text-white/40 dark:group-hover:text-rose-300" />
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
