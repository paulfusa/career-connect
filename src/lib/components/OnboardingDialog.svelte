<script lang="ts">
	import { enhance } from '$app/forms';
	import { errorBox, field, glassDialog, primaryButton } from '$lib/ui';
	import SuggestInput from './SuggestInput.svelte';
	import { searchCities, searchCompanies } from '$lib/suggest.svelte';
	import { MAX_ANSWER_LENGTH, QUESTIONS } from '$lib/onboarding';

	let { name, role }: { name: string; role: keyof typeof QUESTIONS } = $props();

	let pending = $state(false);
	let message = $state('');

	const intro = {
		job_seeker: 'Tell recruiters a little about yourself. You can change this later in your profile.',
		recruiter: 'Let candidates know who they are talking to. You can change this later in your profile.'
	};
</script>

<!-- Esc closes it for this visit only; it comes back until the user saves or skips -->
<dialog
	{@attach (d) => d.showModal()}
	aria-labelledby="onboarding-title"
	class="{glassDialog} max-w-md"
>
	<h2 id="onboarding-title" class="font-display text-2xl font-semibold tracking-tight">
		Welcome to CareerConnect, {name}
	</h2>
	<p class="mt-2 text-ink/65">{intro[role]}</p>

	<form
		method="post"
		action="?/onboard"
		class="mt-7 space-y-5"
		use:enhance={() => {
			pending = true;
			return async ({ result, update }) => {
				message = result.type === 'failure' ? String(result.data?.message ?? '') : '';
				await update({ reset: false });
				pending = false;
			};
		}}
	>
		{#each QUESTIONS[role] as q (q.name)}
			<label class="block">
				<span class="text-sm font-medium">{q.label}</span>
				{#if q.suggest}
					<SuggestInput
						name={q.name}
						search={q.suggest === 'city' ? searchCities : searchCompanies}
						fixed={q.suggest === 'city' ? ['Remote'] : []}
						domainName={q.suggest === 'company' ? 'companyDomain' : undefined}
						required
						maxlength={MAX_ANSWER_LENGTH}
						placeholder={q.placeholder}
						class={field}
					/>
				{:else}
					<input
						type="text"
						name={q.name}
						required
						maxlength={MAX_ANSWER_LENGTH}
						placeholder={q.placeholder}
						autocomplete={q.autocomplete ?? 'off'}
						class={field}
					/>
				{/if}
			</label>
		{/each}

		{#if message}
			<p role="alert" class={errorBox}>
				{message}
			</p>
		{/if}

		<div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
			<button
				formaction="?/skipOnboarding"
				formnovalidate
				disabled={pending}
				class="w-full rounded-xl py-3 font-semibold text-ink/70 transition hover:bg-white/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-tide sm:w-auto sm:px-5"
			>
				Skip for now
			</button>
			<button type="submit" disabled={pending} class="{primaryButton} sm:flex-1">
				{pending ? 'Saving…' : 'Save and continue'}
			</button>
		</div>
	</form>
</dialog>
