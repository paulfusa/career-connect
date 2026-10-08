<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { errorBox, field, primaryButton } from '$lib/ui';
	import PasswordField from '$lib/components/PasswordField.svelte';
	import { page } from '$app/state';

	let { data, form } = $props();

	let pending = $state(false);
</script>

<svelte:head><title>Log in · CareerConnect</title></svelte:head>

<AuthShell title="Welcome back" subtitle="Log in to continue your job search.">
	{#if data.verified}
		<p class="mt-6 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
			Your email has been verified. You can log in now.
		</p>
	{/if}

	
	{#if page.url.searchParams.get('passwordReset') === '1'}
		<div
			role="status"
			class="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
		>
			Password reset successfully. Please sign in.
		</div>
{/if}
	<form
		method="post"
		class="mt-8 space-y-5"
		use:enhance={() => {
			pending = true;

			return async ({ update }) => {
				await update({ reset: false });
				pending = false;
			};
		}}
	>
		<label class="block">
			<span class="text-sm font-medium">Email</span>

			<input
				type="email"
				name="email"
				autocomplete="email"
				required
				value={form?.email ?? ''}
				class={field}
				placeholder="you@example.com"
			/>
		</label>

		<PasswordField autocomplete="current-password" />

		<div class="text-right">
	<a
		href="/forgot-password"
		class="text-sm font-semibold text-tide underline-offset-4 hover:underline"
	>
		Forgot password?
	</a>
</div>

		{#if form?.message}
			<p role="alert" class={errorBox}>
				{form.message}
			</p>
		{/if}

		<button
			type="submit"
			disabled={pending}
			class={primaryButton}
		>
			{pending ? 'Logging in…' : 'Log in'}
		</button>
	</form>

	{#snippet footer()}
		New to CareerConnect?

		<a
			href="/register"
			class="font-semibold text-tide underline-offset-4 hover:underline"
		>
			Create an account
		</a>
	{/snippet}
</AuthShell>