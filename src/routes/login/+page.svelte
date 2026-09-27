<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell, { field, primaryButton } from '$lib/components/AuthShell.svelte';
	import PasswordField from '$lib/components/PasswordField.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let pending = $state(false);
</script>

<svelte:head><title>Log in · CareerConnect</title></svelte:head>

<AuthShell title="Welcome back" subtitle="Log in to continue your job search.">
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

		{#if form?.message}
			<p role="alert" class="rounded-xl bg-rose-50/80 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
				{form.message}
			</p>
		{/if}

		<button type="submit" disabled={pending} class={primaryButton}>
			{pending ? 'Logging in…' : 'Log in'}
		</button>
	</form>

	{#snippet footer()}
		New to CareerConnect?
		<a href="/register" class="font-semibold text-tide underline-offset-4 hover:underline">Create an account</a>
	{/snippet}
</AuthShell>
