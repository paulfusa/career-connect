<script lang="ts">
	import { enhance } from '$app/forms';
	import { field, primaryButton } from './AuthShell.svelte';
	import { MAX_ANSWER_LENGTH, QUESTIONS, searchCities } from '$lib/onboarding';

	let { name, role }: { name: string; role: keyof typeof QUESTIONS } = $props();

	let pending = $state(false);
	let message = $state('');

	let cityOptions = $state<string[]>(['Remote']);
	let cityTimer: ReturnType<typeof setTimeout>;
	let cityRequest: AbortController | undefined;

	function suggestCities(query: string) {
		clearTimeout(cityTimer);
		cityRequest?.abort();
		// picking an option fires input too; don't search again for it
		if (query.trim().length < 2 || cityOptions.includes(query)) return;

		cityTimer = setTimeout(async () => {
			cityRequest = new AbortController();
			try {
				cityOptions = ['Remote', ...(await searchCities(query.trim(), cityRequest.signal))];
			} catch {
				// aborted or offline: keep the last suggestions, typing still works
			}
		}, 250);
	}

	const intro = {
		job_seeker: 'Tell recruiters a little about yourself. You can change this later in your profile.',
		recruiter: 'Let candidates know who they are talking to. You can change this later in your profile.'
	};
</script>

<!-- Esc closes it for this visit only; it comes back until the user saves or skips -->
<dialog
	{@attach (d) => d.showModal()}
	aria-labelledby="onboarding-title"
	class="onboarding m-auto w-[calc(100%-2rem)] max-w-md rounded-[28px] border border-white/60 bg-white/70 p-8 text-ink shadow-[0_30px_80px_-20px_rgba(27,38,56,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl backdrop-saturate-150 backdrop:bg-ink/15 backdrop:backdrop-blur-sm"
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
				<input
					type="text"
					name={q.name}
					required
					maxlength={MAX_ANSWER_LENGTH}
					placeholder={q.placeholder}
					autocomplete={q.autocomplete ?? 'off'}
					list={q.suggestCities ? `${q.name}-options` : undefined}
					oninput={q.suggestCities ? (e) => suggestCities(e.currentTarget.value) : undefined}
					class={field}
				/>
				{#if q.suggestCities}
					<datalist id="{q.name}-options">
						{#each cityOptions as option (option)}
							<option value={option}></option>
						{/each}
					</datalist>
				{/if}
			</label>
		{/each}

		{#if message}
			<p role="alert" class="rounded-xl bg-rose-50/80 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
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

<style>
	.onboarding[open] {
		animation: pop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	.onboarding[open]::backdrop {
		animation: fade 0.3s ease both;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.97);
		}
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.onboarding[open],
		.onboarding[open]::backdrop {
			animation: none;
		}
	}
</style>
