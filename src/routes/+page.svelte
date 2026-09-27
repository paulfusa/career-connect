<script lang="ts">
	import AuthShell from '$lib/components/AuthShell.svelte';
	import OnboardingDialog from '$lib/components/OnboardingDialog.svelte';
	import { QUESTIONS } from '$lib/onboarding';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const roleLabel = { job_seeker: 'a job seeker', recruiter: 'a recruiter' };

	let firstName = $derived(data.user.name.split(' ')[0]);
	let details = $derived(
		QUESTIONS[data.user.role]
			.map((q) => ({ label: q.label, value: data.user[q.name] }))
			.filter((d) => d.value)
	);
</script>

<svelte:head><title>CareerConnect</title></svelte:head>

<!-- ponytail: placeholder landing page until the profile/dashboard stories land -->
<AuthShell
	title="Hi, {firstName}"
	subtitle="You're logged in as {roleLabel[data.user.role]} ({data.user.email})."
>
	{#if details.length}
		<dl class="mt-6 space-y-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70">
			{#each details as d (d.label)}
				<div>
					<dt class="text-xs text-ink/55">{d.label}</dt>
					<dd class="font-medium">{d.value}</dd>
				</div>
			{/each}
		</dl>
	{/if}

	<form method="post" action="?/logout" class="mt-8">
		<button
			class="w-full rounded-xl border border-white/70 bg-white/60 py-3 font-semibold text-ink transition hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
		>
			Log out
		</button>
	</form>
</AuthShell>

{#if !data.user.onboardedAt}
	<OnboardingDialog name={firstName} role={data.user.role} />
{/if}
