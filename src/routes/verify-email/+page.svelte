<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { errorBox, primaryButton, successBox } from '$lib/ui';

	let { data, form } = $props();

	let pending = $state(false);
</script>

<svelte:head><title>Verify your email · CareerConnect</title></svelte:head>

<AuthShell title="Check your email" subtitle="Verify your email before logging in.">
	<div class="mt-8 space-y-6">
		<p class="text-sm">
			We sent a verification link to
			{#if data.email}
				<strong>{data.email}</strong>.
			{:else}
				your email address.
			{/if}
		</p>

		{#if form?.message}
			<p role="status" class={successBox}>{form.message}</p>
		{/if}

		{#if form?.error}
			<p role="alert" class={errorBox}>{form.error}</p>
		{/if}

		<form
			method="POST"
			action="?/resend"
			use:enhance={() => {
				pending = true;

				return async ({ update }) => {
					await update();
					pending = false;
				};
			}}
		>
			<input type="hidden" name="email" value={data.email} />

			<button type="submit" disabled={pending} class={primaryButton}>
				{pending ? 'Sending…' : 'Resend verification email'}
			</button>
		</form>
	</div>

	{#snippet footer()}
		Already verified?
		<a href="/login" class="font-semibold text-tide underline-offset-4 hover:underline">Log in</a>
	{/snippet}
</AuthShell>
