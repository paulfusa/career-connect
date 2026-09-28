<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import Backdrop from '$lib/components/Backdrop.svelte';
	import { glassPanel } from '$lib/ui';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const roleLabel = { job_seeker: 'Job seeker', recruiter: 'Recruiter' };
	const nav = [
		{ href: '/', label: 'Home' },
		{ href: '/profile', label: 'Profile' }
	];

	let tagline = $derived(
		data.user.role === 'recruiter'
			? [data.profile?.jobTitle, data.profile?.company].filter(Boolean).join(' at ')
			: data.profile?.headline
	);
</script>

<Backdrop />

<div class="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[17rem_minmax(0,1fr)] md:gap-8 md:py-10">
	<aside class="app-sidebar md:sticky md:top-10 md:self-start">
		<a href="/" class="mb-5 inline-block font-display text-2xl font-semibold tracking-tight">
			Career<span class="text-tide">Connect</span>
		</a>

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

			<nav class="mt-5 flex gap-1 md:flex-col">
				{#each nav as item (item.href)}
					<a
						href={item.href}
						aria-current={page.url.pathname === item.href ? 'page' : undefined}
						class="flex-1 rounded-xl px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-white/60 hover:text-ink aria-[current=page]:bg-white/75 aria-[current=page]:text-ink md:flex-none"
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<form method="post" action="/logout" class="mt-4 border-t border-white/60 pt-4">
				<button
					class="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink/60 transition hover:bg-white/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-tide"
				>
					Log out
				</button>
			</form>
		</section>
	</aside>

	<main class="min-w-0">
		{@render children()}
	</main>
</div>
