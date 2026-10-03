<script lang="ts">
	import { enhance } from '$app/forms';
	import FieldError from '$lib/components/FieldError.svelte';
	import { EMPLOYMENT_TYPES, LIMITS, WORK_MODES } from '$lib/profile-options';
	import { withPending } from '$lib/forms';
	import type { JobPostingInput } from '$lib/server/job-posting';
	import { errorBox, field, label, primaryButton, secondaryButton } from '$lib/ui';

	let {
		action,
		submitLabel,
		values,
		errors
	}: {
		action: string;
		submitLabel: string;
		values: Partial<JobPostingInput>;
		errors?: Partial<Record<keyof JobPostingInput, string>>;
	} = $props();

	let pending = $state(false);
</script>

<form method="post" {action} class="space-y-5" use:enhance={withPending((value) => (pending = value))}>
	<label class="block">
		<span class={label}>Job title</span>
		<input name="title" required maxlength={LIMITS.short} value={values.title ?? ''} placeholder="Software Engineer" aria-invalid={!!errors?.title} aria-describedby="title-error" class={field} />
		<FieldError id="title-error" message={errors?.title} />
	</label>

	<div class="grid gap-5 sm:grid-cols-2">
		<label class="block">
			<span class={label}>Company</span>
			<input name="company" required maxlength={LIMITS.short} value={values.company ?? ''} placeholder="Company name" aria-invalid={!!errors?.company} aria-describedby="company-error" class={field} />
			<FieldError id="company-error" message={errors?.company} />
		</label>
		<label class="block">
			<span class={label}>Location</span>
			<input name="location" required maxlength={LIMITS.short} value={values.location ?? ''} placeholder="Montreal, QC or Remote" aria-invalid={!!errors?.location} aria-describedby="location-error" class={field} />
			<FieldError id="location-error" message={errors?.location} />
		</label>
	</div>

	<div class="grid gap-5 sm:grid-cols-2">
		<label class="block">
			<span class={label}>Employment type</span>
			<select name="employmentType" required aria-invalid={!!errors?.employmentType} aria-describedby="employmentType-error" class={field}>
				<option value="">Choose one</option>
				{#each Object.entries(EMPLOYMENT_TYPES) as [value, text] (value)}
					<option {value} selected={values.employmentType === value}>{text}</option>
				{/each}
			</select>
			<FieldError id="employmentType-error" message={errors?.employmentType} />
		</label>
		<label class="block">
			<span class={label}>Work mode</span>
			<select name="workMode" required aria-invalid={!!errors?.workMode} aria-describedby="workMode-error" class={field}>
				<option value="">Choose one</option>
				{#each Object.entries(WORK_MODES) as [value, text] (value)}
					<option {value} selected={values.workMode === value}>{text}</option>
				{/each}
			</select>
			<FieldError id="workMode-error" message={errors?.workMode} />
		</label>
	</div>

	<label class="block">
		<span class={label}>Description</span>
		<textarea name="description" required rows="9" maxlength="5000" placeholder="Describe the role, responsibilities, and qualifications." aria-invalid={!!errors?.description} aria-describedby="description-error" class={field}>{values.description ?? ''}</textarea>
		<FieldError id="description-error" message={errors?.description} />
	</label>

	{#if errors && Object.keys(errors).length}
		<p role="alert" class={errorBox}>Some fields need fixing before this posting can be saved.</p>
	{/if}

	<div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center">
		<a href="/jobs" class="{secondaryButton} text-center sm:mr-auto">Cancel</a>
		{#if submitLabel === 'Save changes'}
			<button
				formaction="?/delete"
				formnovalidate
				disabled={pending}
				onclick={(event) => {
					if (!confirm('Delete this job posting? This can’t be undone.')) event.preventDefault();
				}}
				class="rounded-xl px-4 py-2.5 font-semibold text-rose-700 transition hover:bg-rose-50/80 focus-visible:outline-2 focus-visible:outline-rose-600"
			>
				Delete posting
			</button>
		{/if}
		<button type="submit" disabled={pending} class="{primaryButton} sm:w-auto sm:px-6">
			{pending ? 'Saving…' : submitLabel}
		</button>
	</div>
</form>
