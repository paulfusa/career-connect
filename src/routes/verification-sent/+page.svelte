<script lang="ts">
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { primaryButton } from '$lib/ui';

	let { data } = $props();
</script>

<svelte:head>
	<title>Verification email sent · CareerConnect</title>
</svelte:head>

<AuthShell
	title="Check your email"
	subtitle="We've sent you a verification link."
>
	<div class="mt-8 space-y-6">
		<div class="space-y-3 text-sm">
			<p>
				A verification link has been sent to
				{#if data.email}
					<strong>{data.email}</strong>.
				{:else}
					your email address.
				{/if}
			</p>

			<p>
				Please open the email and click the verification link to activate your account.
			</p>

			<p class="text-slate-500">
				The verification link will expire in 1 hour.
			</p>
		</div>

		<a href="/login" class={`${primaryButton} block text-center`}>
	        Return to login
        </a>
	</div>

	{#snippet footer()}
		Already verified?
		<a
			href="/login"
			class="font-semibold text-tide underline-offset-4 hover:underline"
		>
			Log in
		</a>
	{/snippet}
</AuthShell>