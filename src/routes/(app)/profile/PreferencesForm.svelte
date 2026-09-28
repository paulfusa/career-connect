<script lang="ts">
	import { enhance } from '$app/forms';
	import ChipInput from '$lib/components/ChipInput.svelte';
	import { withPending } from '$lib/forms';
	import { JOB_TYPES, LIMITS, WORK_MODES } from '$lib/profile-options';
	import type { Profile } from '$lib/server/db/schema';
	import { searchCities } from '$lib/suggest.svelte';
	import { errorBox, label, pill } from '$lib/ui';
	import FormButtons from './FormButtons.svelte';

	let { profile: p, errors }: { profile: Profile | null; errors?: Record<string, string> } = $props();
	let pending = $state(false);
</script>

<form method="post" action="?/preferences" class="mt-6 space-y-6" use:enhance={withPending((v) => (pending = v))}>
	<label class="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/70">
		<input type="checkbox" name="openToWork" checked={p?.openToWork} class="mt-0.5 size-5 rounded border-white text-tide focus:ring-tide/30" />
		<span>
			<span class="block font-semibold">I’m open to work</span>
			<span class="block text-sm text-ink/60">Shows an “Open to work” badge on your profile for recruiters.</span>
		</span>
	</label>

	<ChipInput
		name="desiredRoles"
		label="Roles you want"
		values={p?.desiredRoles}
		max={LIMITS.listItems}
		placeholder="e.g. Software developer intern"
		hint="Type a role and press Enter."
	/>

	<fieldset>
		<legend class={label}>Job types</legend>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each Object.entries(JOB_TYPES) as [value, text] (value)}
				<label class={pill}>
					<input type="checkbox" name="jobTypes" {value} checked={p?.jobTypes.includes(value)} class="sr-only" />
					{text}
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend class={label}>Work mode</legend>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each Object.entries(WORK_MODES) as [value, text] (value)}
				<label class={pill}>
					<input type="checkbox" name="workModes" {value} checked={p?.workModes.includes(value)} class="sr-only" />
					{text}
				</label>
			{/each}
		</div>
	</fieldset>

	<ChipInput
		name="preferredLocations"
		label="Preferred locations"
		values={p?.preferredLocations}
		search={searchCities}
		max={LIMITS.listItems}
		placeholder="Start typing a city"
	/>

	{#if errors}<p role="alert" class={errorBox}>{Object.values(errors)[0]}</p>{/if}
	<FormButtons {pending} />
</form>
