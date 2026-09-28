<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { errorBox, field, primaryButton } from '$lib/ui';
	import PasswordField from '$lib/components/PasswordField.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let pending = $state(false);

	const roles = [
		{ value: 'job_seeker', label: 'Find a job', detail: 'Build a profile and apply' },
		{ value: 'recruiter', label: 'Hire people', detail: 'Post jobs and review applicants' }
	];
</script>

<svelte:head><title>Create an account · CareerConnect</title></svelte:head>

<AuthShell title="Create your account" subtitle="It takes less than a minute.">
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
		<fieldset>
			<legend class="text-sm font-medium">I'm here to</legend>
			<div class="mt-1.5 grid grid-cols-2 gap-2">
				{#each roles as role, i (role.value)}
					<label
						class="cursor-pointer rounded-xl border border-white/70 bg-white/50 p-3 transition hover:bg-white/70 has-checked:border-tide has-checked:bg-white/85 has-checked:ring-4 has-checked:ring-tide/15 has-focus-visible:outline-2 has-focus-visible:outline-tide"
					>
						<input
							type="radio"
							name="role"
							value={role.value}
							required
							checked={form?.role ? form.role === role.value : i === 0}
							class="sr-only"
						/>
						<span class="block font-semibold">{role.label}</span>
						<span class="mt-0.5 block text-xs leading-snug text-ink/60">{role.detail}</span>
					</label>
				{/each}
			</div>
		</fieldset>

		<label class="block">
			<span class="text-sm font-medium">Full name</span>
			<input type="text" name="name" autocomplete="name" required value={form?.name ?? ''} class={field} />
		</label>

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

		<PasswordField autocomplete="new-password" hint="At least 8 characters." />

		{#if form?.message}
			<p role="alert" class={errorBox}>
				{form.message}
			</p>
		{/if}

		<button type="submit" disabled={pending} class={primaryButton}>
			{pending ? 'Creating account…' : 'Create account'}
		</button>
	</form>

	{#snippet footer()}
		Already have an account?
		<a href="/login" class="font-semibold text-tide underline-offset-4 hover:underline">Log in</a>
	{/snippet}
</AuthShell>
