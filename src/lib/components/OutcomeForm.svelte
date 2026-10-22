<script lang="ts">
	import { enhance } from '$app/forms';
	import FieldError from '$lib/components/FieldError.svelte';
	import { withPending } from '$lib/forms';
	import type { OutcomeInput } from '$lib/server/application-outcome';
	import { errorBox, field, label, primaryButton } from '$lib/ui';

	let {
		action,
		applicationId,
		values,
		errors
	}: {
		action: string;
		applicationId: string;
		values: Partial<OutcomeInput>;
		errors?: Partial<Record<keyof OutcomeInput, string>>;
	} = $props();

	let pending = $state(false);
	// svelte-ignore state_referenced_locally
	let status = $state(values.status ?? '');
</script>

<!-- one form per applicant on the same page, so the error ids start with the application id -->
<form method="post" {action} class="space-y-5" use:enhance={withPending((value) => (pending = value))}>
	<input type="hidden" name="applicationId" value={applicationId} />

	<label class="block">
		<span class={label}>Decision</span>
		<select name="status" required aria-invalid={!!errors?.status} aria-describedby="{applicationId}-status-error" class={field} bind:value={status}>
			<option value="">Choose one</option>
			<option value="offered">Offer the job</option>
			<option value="rejected">Reject the application</option>
		</select>
		<FieldError id="{applicationId}-status-error" message={errors?.status} />
	</label>

	<label class="block">
		<span class={label}>Reasons for your decision</span>
		<textarea name="message" required rows="6" maxlength="2000" placeholder="Explain your decision in your own words." aria-invalid={!!errors?.message} aria-describedby="{applicationId}-message-error" class={field}>{values.message ?? ''}</textarea>
		<FieldError id="{applicationId}-message-error" message={errors?.message} />
	</label>

	{#if status === 'offered'}
		<label class="block">
			<span class={label}>Next steps</span>

			<textarea name="nextSteps" required rows="4" maxlength="2000" placeholder="What happens next, and how the applicant should respond." aria-invalid={!!errors?.nextSteps} aria-describedby="{applicationId}-nextSteps-error" class={field}>{values.nextSteps ?? ''}</textarea>
			<FieldError id="{applicationId}-nextSteps-error" message={errors?.nextSteps} />
		</label>
	{/if}

	{#if errors && Object.keys(errors).length}
		<p role="alert" class={errorBox}>Some fields need fixing before this decision can be sent.</p>
	{/if}

	<button type="submit" disabled={pending} class="{primaryButton} sm:w-auto sm:px-6">
		{pending ? 'Sending…' : 'Send decision'}
	</button>
</form>
