<script lang="ts">
	import { enhance } from '$app/forms';
	import FieldError from '$lib/components/FieldError.svelte';
	import SuggestInput from '$lib/components/SuggestInput.svelte';
	import { withPending } from '$lib/forms';
	import { EMPLOYMENT_TYPES, LIMITS } from '$lib/profile-options';
	import type { Experience } from '$lib/server/db/schema';
	import { searchCities, searchCompanies } from '$lib/suggest.svelte';
	import { errorBox, field, label } from '$lib/ui';
	import FormButtons from './FormButtons.svelte';

	// entry is null when adding a new experience
	let { entry, errors }: { entry: Experience | null; errors?: Record<string, string> } = $props();

	let pending = $state(false);
	// svelte-ignore state_referenced_locally
	let current = $state(!!entry && !entry.endDate);
	const thisMonth = new Date().toISOString().slice(0, 7);
	const month = (d: string | null | undefined) => d?.slice(0, 7) ?? '';
</script>

<form method="post" action="?/saveExperience" class="mt-6 space-y-5" use:enhance={withPending((v) => (pending = v))}>
	{#if entry}<input type="hidden" name="id" value={entry.id} />{/if}

	<label class="block">
		<span class={label}>Title</span>
		<input name="title" required maxlength={LIMITS.short} placeholder="Software developer intern" value={entry?.title ?? ''} aria-invalid={!!errors?.title} aria-describedby="title-error" class={field} />
		<FieldError id="title-error" message={errors?.title} />
	</label>

	<div class="grid gap-5 sm:grid-cols-2">
		<label class="block">
			<span class={label}>Company</span>
			<SuggestInput
				name="company"
				search={searchCompanies}
				domainName="companyDomain"
				value={entry?.company}
				domain={entry?.companyDomain}
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
			<span class={label}>Employment type</span>
			<select name="employmentType" class={field}>
				<option value="">Choose one</option>
				{#each Object.entries(EMPLOYMENT_TYPES) as [value, text] (value)}
					<option {value} selected={entry?.employmentType === value}>{text}</option>
				{/each}
			</select>
		</label>
	</div>

	<label class="block">
		<span class={label}>Location</span>
		<SuggestInput name="location" search={searchCities} fixed={['Remote']} value={entry?.location} maxlength={LIMITS.short} placeholder="Start typing a city" class={field} />
	</label>

	<label class="flex items-center gap-2.5">
		<input type="checkbox" name="current" bind:checked={current} class="size-5 rounded border-white text-tide focus:ring-tide/30" />
		<span class="text-sm font-medium">I currently work here</span>
	</label>

	<div class="grid gap-5 sm:grid-cols-2">
		<label class="block">
			<span class={label}>Start date</span>
			<input type="month" name="startDate" required max={thisMonth} value={month(entry?.startDate)} aria-invalid={!!errors?.startDate} aria-describedby="startDate-error" class={field} />
			<FieldError id="startDate-error" message={errors?.startDate} />
		</label>
		<label class="block">
			<span class={label}>End date</span>
			<input type="month" name="endDate" disabled={current} required={!current} value={month(entry?.endDate)} aria-invalid={!!errors?.endDate} aria-describedby="endDate-error" class="{field} disabled:opacity-50" />
			<FieldError id="endDate-error" message={errors?.endDate} />
		</label>
	</div>

	<label class="block">
		<span class={label}>Description</span>
		<textarea name="description" rows="5" maxlength={LIMITS.description} placeholder="What you worked on, the tools you used, and what you achieved." aria-describedby="description-error" class={field}>{entry?.description ?? ''}</textarea>
		<FieldError id="description-error" message={errors?.description} />
	</label>

	{#if errors}<p role="alert" class={errorBox}>Some fields need fixing before this can be saved.</p>{/if}
	<FormButtons {pending} deleteAction={entry ? '?/deleteExperience' : undefined} />
</form>
