<script lang="ts">
	import { enhance } from '$app/forms';
	import FieldError from '$lib/components/FieldError.svelte';
	import { withPending } from '$lib/forms';
	import { LIMITS } from '$lib/profile-options';
	import { field, hint } from '$lib/ui';
	import FormButtons from './FormButtons.svelte';

	let { about, isSeeker, errors }: { about: string | null; isSeeker: boolean; errors?: Record<string, string> } = $props();

	let pending = $state(false);
	// svelte-ignore state_referenced_locally
	let text = $state(about ?? '');
</script>

<form method="post" action="?/about" class="mt-6 space-y-5" use:enhance={withPending((v) => (pending = v))}>
	<label class="block">
		<span class="sr-only">About</span>
		<textarea
			name="about"
			rows="8"
			maxlength={LIMITS.about}
			bind:value={text}
			placeholder={isSeeker
				? 'What you study or do, what you’re good at, and the kind of role you want next.'
				: 'Your role, your team, and the kind of people you hire.'}
			aria-describedby="about-hint about-error"
			class={field}
		></textarea>
		<span id="about-hint" class={hint}>{text.length}/{LIMITS.about} characters</span>
		<FieldError id="about-error" message={errors?.about} />
	</label>
	<FormButtons {pending} />
</form>
