<script lang="ts">
	import AuthShell from '$lib/components/AuthShell.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const roleLabel = { job_seeker: 'a job seeker', recruiter: 'a recruiter' };
</script>

<svelte:head><title>CareerConnect</title></svelte:head>

<!-- ponytail: placeholder landing page until the profile/dashboard stories land -->
<AuthShell
	title="Hi, {data.user.name.split(' ')[0]}"
	subtitle="You're logged in as {roleLabel[data.user.role]} ({data.user.email})."
>
	<form method="post" action="?/logout" class="mt-8">
		<button
			class="w-full rounded-xl border border-white/70 bg-white/60 py-3 font-semibold text-ink transition hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
		>
			Log out
		</button>
	</form>
</AuthShell>
