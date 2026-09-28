<script lang="ts">
	import { enhance } from '$app/forms';
	import ChipInput from '$lib/components/ChipInput.svelte';
	import { withPending } from '$lib/forms';
	import { LIMITS } from '$lib/profile-options';
	import { SKILLS } from '$lib/skills';
	import { errorBox } from '$lib/ui';
	import FormButtons from './FormButtons.svelte';

	let { skills, topSkills, errors }: { skills: string[]; topSkills: string[]; errors?: Record<string, string> } = $props();
	let pending = $state(false);
</script>

<form method="post" action="?/skills" class="mt-6 space-y-5" use:enhance={withPending((v) => (pending = v))}>
	<ChipInput
		name="skills"
		label="Skills"
		values={skills}
		options={SKILLS}
		max={LIMITS.skills}
		maxLength={LIMITS.skill}
		placeholder="Search skills, e.g. Python, Figma, Leadership"
		hint="Pick from the list or type your own. Star up to {LIMITS.topSkills} top skills to show them first."
		starName="topSkills"
		starred={topSkills}
		maxStarred={LIMITS.topSkills}
	/>
	{#if errors}<p role="alert" class={errorBox}>{errors.skills ?? errors.topSkills}</p>{/if}
	<FormButtons {pending} />
</form>
