<script lang="ts">
	import { enhance } from '$app/forms';
	import FieldError from '$lib/components/FieldError.svelte';
	import SuggestInput from '$lib/components/SuggestInput.svelte';
	import { searchCities, searchCompanies } from '$lib/suggest.svelte';
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
			<SuggestInput
				name="company"
				search={searchCompanies}
				domainName="companyDomain"
				value={values.company}
				domain={values.companyDomain}
				required
				maxlength={LIMITS.short}
				placeholder="Start typing a company"
				aria-invalid={!!errors?.company}
				aria-describedby="company-error"
				class={field}
			/>
			<FieldError id="company-error" message={errors?.company} />
		</label>
		<label class="block">
			<span class={label}>Location</span>
			<SuggestInput
				name="location"
				search={searchCities}
				fixed={['Remote']}
				value={values.location}
				required
				maxlength={LIMITS.short}
				placeholder="Start typing a city, or Remote"
				aria-invalid={!!errors?.location}
				aria-describedby="location-error"
				class={field}
			/>
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

	<label class="block">
		<span class={label}>Requirements</span>
		<textarea name="requirements" required rows="5" maxlength="5000" placeholder="List the skills, experience, and qualifications." aria-invalid={!!errors?.requirements} aria-describedby="requirements-error" class={field}>{values.requirements ?? ''}</textarea>
		<FieldError id="requirements-error" message={errors?.requirements} />
	</label>

	<label class="block">
		<span class={label}>Application deadline</span>
		<input name="applicationDeadline" type="date" required value={values.applicationDeadline ?? ''} aria-invalid={!!errors?.applicationDeadline} aria-describedby="applicationDeadline-error" class={field} />
		<FieldError id="applicationDeadline-error" message={errors?.applicationDeadline} />
	</label>

	<label class="block">
		<span class={label}>Status</span>
		<select name="status" required aria-invalid={!!errors?.status} aria-describedby="status-error" class={field}>
			<option value="open" selected={(values.status ?? 'open') === 'open'}>Open</option>
			<option value="closed" selected={(values.status ?? 'open') === 'closed'}>Not receiving applications</option>
		</select>
		<FieldError id="status-error" message={errors?.status} />
	</label>

	<label class="flex items-center gap-3">
		<input type="checkbox" name="published" checked={values.published ?? true} class="size-4" />
		<span>Published (visible to job seekers)</span>
	</label>

	<div class="grid gap-5 sm:grid-cols-2">
		<label class="block">
			<span class={label}>Minimum salary</span>
			<input name="salaryMin" type="number" min="0" step="1" value={values.salaryMin ?? ''} placeholder="e.g. 50000" aria-invalid={!!errors?.salaryMin} aria-describedby="salaryMin-error" class={field} />
			<FieldError id="salaryMin-error" message={errors?.salaryMin} />
		</label>
		<label class="block">
			<span class={label}>Maximum salary</span>
			<input name="salaryMax" type="number" min="0" step="1" value={values.salaryMax ?? ''} placeholder="e.g. 70000" aria-invalid={!!errors?.salaryMax} aria-describedby="salaryMax-error" class={field} />
			<FieldError id="salaryMax-error" message={errors?.salaryMax} />
		</label>
	</div>

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
