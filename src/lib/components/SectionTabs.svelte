<script lang="ts">
	import { page } from '$app/state';
	import Icon, { type IconName } from '$lib/components/Icon.svelte';

	// The sidebar links to one page per area; the related pages of that area are tabs here.
	let { section }: { section: 'jobs' | 'people' | 'settings' } = $props();

	type Tab = { href: string; label: string; icon: IconName; current: boolean };

	let tabs = $derived.by((): Tab[] => {
		const { pathname, searchParams } = page.url;
		const seeker = page.data.user?.role === 'job_seeker';
		const at = (href: string) => pathname === href;
		if (section === 'people') {
			return [
				{ href: '/people', label: seeker ? 'Recruiters' : 'Job seekers', icon: 'users', current: at('/people') },
				{ href: '/following', label: 'Following', icon: 'userCheck', current: at('/following') }
			];
		}
		if (section === 'settings') {
			return [
				{ href: '/settings', label: 'Settings', icon: 'settings', current: at('/settings') },
				{ href: '/suggestions', label: 'Suggest a feature', icon: 'lightbulb', current: at('/suggestions') },
				...(page.data.user?.isAdmin
					? [{ href: '/suggestions/review', label: 'Review suggestions', icon: 'clipboardCheck' as const, current: at('/suggestions/review') }]
					: [])
			];
		}
		if (seeker) {
			return [
				{ href: '/jobs', label: 'All jobs', icon: 'briefcase', current: at('/jobs') },
				{ href: '/matches', label: 'Job matches', icon: 'sparkles', current: at('/matches') },
				{ href: '/reviews', label: 'My reviews', icon: 'star', current: at('/reviews') }
			];
		}
		const mine = at('/jobs') && searchParams.has('mine');
		const archived = mine && searchParams.get('archived') === '1';
		return [
			{ href: '/jobs', label: 'All postings', icon: 'briefcase', current: at('/jobs') && !mine },
			{ href: '/jobs?mine', label: 'Active', icon: 'file', current: mine && !archived },
			{ href: '/jobs?mine&archived=1', label: 'Archived', icon: 'archive', current: archived },
			{ href: '/company/reviews', label: 'Company reviews', icon: 'star', current: at('/company/reviews') }
		];
	});
</script>

<nav
	aria-label="{section === 'jobs' ? 'Jobs' : section === 'people' ? 'People' : 'Settings'} sections"
	class="mb-6 flex w-fit max-w-full flex-wrap gap-1 rounded-2xl bg-white/45 p-1 ring-1 ring-white/60 dark:bg-[#242427] dark:ring-white/10"
>
	{#each tabs as tab (tab.href)}
		<a
			href={tab.href}
			aria-current={tab.current ? 'page' : undefined}
			class="group flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-ink/65 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-tide aria-[current=page]:bg-white/85 aria-[current=page]:text-ink aria-[current=page]:shadow-sm dark:hover:text-white dark:aria-[current=page]:bg-[#444448] dark:aria-[current=page]:text-white"
		>
			<Icon name={tab.icon} class="size-4 text-ink/45 group-aria-[current=page]:text-tide dark:text-white/45 dark:group-aria-[current=page]:text-[#7dd3df]" />
			{tab.label}
		</a>
	{/each}
</nav>
