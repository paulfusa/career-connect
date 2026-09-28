<script lang="ts">
	import { enhance } from '$app/forms';
	import FieldError from '$lib/components/FieldError.svelte';
	import SuggestInput from '$lib/components/SuggestInput.svelte';
	import { withPending } from '$lib/forms';
	import { DEGREES, LIMITS } from '$lib/profile-options';
	import type { Education } from '$lib/server/db/schema';
	import { searchSchools } from '$lib/suggest.svelte';
	import { errorBox, field, label } from '$lib/ui';
	import FormButtons from './FormButtons.svelte';

	// entry is null when adding a new school
	let { entry, errors }: { entry: Education | null; errors?: Record<string, string> } = $props();

	let pending = $state(false);
	const maxYear = new Date().getFullYear() + 8;
</script>

<form method="post" action="?/saveEducation" class="mt-6 space-y-5" use:enhance={withPending((v) => (pending = v))}>
	{#if entry}<input type="hidden" name="id" value={entry.id} />{/if}

	<label class="block">
		<span class={label}>School</span>
		<SuggestInput
			name="school"
			search={searchSchools}
			domainName="schoolDomain"
			value={entry?.school}
			domain={entry?.schoolDomain}
			required
			maxlength={LIMITS.short}
			placeholder="Start typing a school, CEGEP or university"
			aria-invalid={!!errors?.school}
			aria-describedby="school-error"
			class={field}
		/>
		<FieldError id="school-error" message={errors?.school} />
	</label>

	<div class="grid gap-5 sm:grid-cols-2">
		<label class="block">
			<span class={label}>Degree</span>
			<input name="degree" list="degree-options" maxlength={LIMITS.short} placeholder="Bachelor of Engineering (BEng)" value={entry?.degree ?? ''} class={field} />
			<datalist id="degree-options">
				{#each DEGREES as degree (degree)}<option value={degree}></option>{/each}
			</datalist>
		</label>
		<label class="block">
			<span class={label}>Field of study</span>
			<input name="fieldOfStudy" maxlength={LIMITS.short} placeholder="Software Engineering" value={entry?.fieldOfStudy ?? ''} class={field} />
		</label>
	</div>

	<div class="grid gap-5 sm:grid-cols-2">
		<label class="block">
			<span class={label}>Start year</span>
			<input type="number" name="startYear" min="1950" max={maxYear} placeholder="2023" value={entry?.startYear ?? ''} aria-describedby="startYear-error" class={field} />
			<FieldError id="startYear-error" message={errors?.startYear} />
		</label>
		<label class="block">
			<span class={label}>End year (or expected)</span>
			<input type="number" name="endYear" min="1950" max={maxYear} placeholder="2027" value={entry?.endYear ?? ''} aria-describedby="endYear-error" class={field} />
			<FieldError id="endYear-error" message={errors?.endYear} />
		</label>
	</div>

	<label class="block">
		<span class={label}>Description</span>
		<textarea name="description" rows="4" maxlength={LIMITS.description} placeholder="Relevant courses, clubs, awards or GPA." aria-describedby="description-error" class={field}>{entry?.description ?? ''}</textarea>
		<FieldError id="description-error" message={errors?.description} />
	</label>

	{#if errors}<p role="alert" class={errorBox}>Some fields need fixing before this can be saved.</p>{/if}
	<FormButtons {pending} deleteAction={entry ? '?/deleteEducation' : undefined} />
</form>
