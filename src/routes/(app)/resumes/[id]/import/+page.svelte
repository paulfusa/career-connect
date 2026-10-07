<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { EMPLOYMENT_TYPES } from '$lib/profile-options';
	import { errorBox, glassPanel, primaryButton, secondaryButton } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let pending = $state<'extract' | 'import' | null>(null);
	// "Read it again" lives inside the import form, so which request is running comes from the action URL
	const track: SubmitFunction = ({ action }) => {
		pending = action.search.includes('extract') ? 'extract' : 'import';
		return async ({ update }) => {
			await update({ reset: false });
			pending = null;
		};
	};

	let parsed = $derived(data.resume.parsed);
	let p = $derived(data.profile);

	const fieldLabels = {
		headline: 'Headline',
		about: 'About',
		location: 'Location',
		phone: 'Phone number',
		linkedinUrl: 'LinkedIn',
		githubUrl: 'GitHub',
		websiteUrl: 'Website'
	} as const;
	type Field = keyof typeof fieldLabels;

	// fields the resume has a value for that differs from the profile
	let fields = $derived(
		parsed
			? (Object.keys(fieldLabels) as Field[])
					.filter((f) => parsed.profile[f] && parsed.profile[f] !== p?.[f])
					.map((f) => ({ name: f, label: fieldLabels[f], value: parsed.profile[f]!, current: p?.[f] ?? null }))
			: []
	);
	let newSkills = $derived(
		parsed?.skills.filter((s) => !p?.skills.some((own) => own.toLowerCase() === s.toLowerCase())) ?? []
	);
	let nothingFound = $derived(
		!!parsed && !fields.length && !newSkills.length && !parsed.experience.length && !parsed.education.length
	);

	const monthFmt = new Intl.DateTimeFormat('en-CA', { month: 'short', year: 'numeric', timeZone: 'UTC' });
	const month = (d: string) => monthFmt.format(new Date(`${d}T00:00:00Z`));

	const card = `${glassPanel} p-6`;
	const heading = 'font-display text-xl font-semibold';
	const row = 'flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-white/50 has-disabled:cursor-default has-disabled:opacity-55 has-disabled:hover:bg-transparent';
	const box = 'mt-0.5 size-5 shrink-0 rounded border-white text-tide focus:ring-tide/30';
	const waiting = $derived(
		data.ai.local
			? 'Reading your resume on a local AI model. This can take a minute or two; keep this page open.'
			: 'Reading your resume. This usually takes a few seconds.'
	);
</script>

<svelte:head><title>Fill profile from resume · CareerConnect</title></svelte:head>

<div class="space-y-5 md:mt-14">
	<div>
		<a href="/resumes" class="text-sm font-medium text-tide-deep hover:underline">← Resumes</a>
		<h1 class="mt-3 font-display text-3xl font-semibold tracking-tight">Fill profile from resume</h1>
		<p class="mt-2 text-ink/60">From <span class="font-medium text-ink/80">{data.resume.fileName}</span></p>
	</div>

	{#if form?.error && !pending}<p role="alert" class={errorBox}>{form.error}</p>{/if}

	{#if !data.ai.configured}
		<p class={card}>AI features aren’t set up on this server yet. See <code>docs/ai-setup.md</code> to turn them on.</p>
	{:else if !parsed}
		<form method="post" action="?/extract" class={card} use:enhance={track}>
			<h2 class={heading}>Let AI read your resume</h2>
			<p class="mt-2 text-ink/70">
				It picks out your experience, education, skills and contact details. You then choose what to add: nothing
				changes on your profile until you confirm.
			</p>
			<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
				<button type="submit" disabled={!!pending} class="{primaryButton} sm:w-auto sm:px-6">
					{pending ? 'Reading…' : 'Read my resume'}
				</button>
				<p class="text-sm text-ink/55" aria-live="polite">{pending ? waiting : ''}</p>
			</div>
		</form>
	{:else if nothingFound}
		<form method="post" action="?/extract" class={card} use:enhance={track}>
			<h2 class={heading}>Nothing new to add</h2>
			<p class="mt-2 text-ink/70">Everything the AI found in this resume is already on your profile, or it couldn’t find usable details.</p>
			<button type="submit" disabled={!!pending} class="{secondaryButton} mt-4">{pending ? 'Reading…' : 'Read it again'}</button>
			<p class="mt-2 text-sm text-ink/55" aria-live="polite">{pending ? waiting : ''}</p>
		</form>
	{:else}
		<form method="post" action="?/import" class="space-y-5" use:enhance={track}>
			<p class="text-ink/70">
				Tick what you want on your profile. AI can misread things, especially dates, so give it a quick check. You can
				edit everything afterwards.
			</p>

			{#if fields.length}
				<section class={card}>
					<h2 class={heading}>About you</h2>
					<div class="mt-2">
						{#each fields as f (f.name)}
							<label class={row}>
								<!-- pre-ticked only where the profile is empty, so nothing is overwritten by default -->
								<input type="checkbox" name="field" value={f.name} checked={!f.current} class={box} />
								<span class="min-w-0">
									<span class="block text-xs text-ink/55">{f.label}</span>
									<span class="block whitespace-pre-line break-words">{f.value}</span>
									{#if f.current}
										<span class="mt-1 block text-xs text-amber-700">Replaces: {f.current}</span>
									{/if}
								</span>
							</label>
						{/each}
					</div>
				</section>
			{/if}

			{#if parsed.experience.length}
				<section class={card}>
					<h2 class={heading}>Experience</h2>
					<div class="mt-2">
						{#each parsed.experience as e, i (i)}
							{@const dup = data.duplicates?.experience[i]}
							<label class={row}>
								<input type="checkbox" name="experience" value={i} checked={!dup} disabled={dup} class={box} />
								<span class="min-w-0">
									<span class="block font-semibold">{e.title}</span>
									<span class="block text-ink/75">
										{e.company}{#if e.employmentType}<span class="text-ink/50">{' · '}{EMPLOYMENT_TYPES[e.employmentType as keyof typeof EMPLOYMENT_TYPES]}</span>{/if}
									</span>
									<span class="block text-sm text-ink/55">
										{month(e.startDate)} – {e.endDate ? month(e.endDate) : 'Present'}{#if e.location}{' · '}{e.location}{/if}
									</span>
									{#if e.description}<span class="mt-1.5 block whitespace-pre-line text-sm text-ink/75">{e.description}</span>{/if}
									{#if dup}<span class="mt-1 block text-xs font-medium">Already on your profile</span>{/if}
								</span>
							</label>
						{/each}
					</div>
				</section>
			{/if}

			{#if parsed.education.length}
				<section class={card}>
					<h2 class={heading}>Education</h2>
					<div class="mt-2">
						{#each parsed.education as e, i (i)}
							{@const dup = data.duplicates?.education[i]}
							<label class={row}>
								<input type="checkbox" name="education" value={i} checked={!dup} disabled={dup} class={box} />
								<span class="min-w-0">
									<span class="block font-semibold">{e.school}</span>
									{#if e.degree || e.fieldOfStudy}
										<span class="block text-ink/75">{[e.degree, e.fieldOfStudy].filter(Boolean).join(', ')}</span>
									{/if}
									{#if e.startYear || e.endYear}
										<span class="block text-sm text-ink/55">{[e.startYear, e.endYear].filter(Boolean).join(' – ')}</span>
									{/if}
									{#if e.description}<span class="mt-1.5 block whitespace-pre-line text-sm text-ink/75">{e.description}</span>{/if}
									{#if dup}<span class="mt-1 block text-xs font-medium">Already on your profile</span>{/if}
								</span>
							</label>
						{/each}
					</div>
				</section>
			{/if}

			{#if newSkills.length}
				<section class={card}>
					<h2 class={heading}>Skills</h2>
					<label class="{row} mt-2">
						<input type="checkbox" name="skills" checked class={box} />
						<span class="min-w-0">
							<span class="block">Add {newSkills.length} new skill{newSkills.length === 1 ? '' : 's'}</span>
							<span class="mt-2 flex flex-wrap gap-2">
								{#each newSkills as skill (skill)}
									<span class="rounded-full bg-white/70 px-3 py-1 text-sm ring-1 ring-white">{skill}</span>
								{/each}
							</span>
						</span>
					</label>
				</section>
			{/if}

			{#if parsed.skipped}
				<p class="text-sm text-ink/55">
					{parsed.skipped} item{parsed.skipped === 1 ? '' : 's'} couldn’t be read reliably (for example a missing date) and
					{parsed.skipped === 1 ? 'was' : 'were'} left out. You can add {parsed.skipped === 1 ? 'it' : 'them'} by hand on your profile.
				</p>
			{/if}

			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
				<button formaction="?/extract" formnovalidate disabled={!!pending} class="{secondaryButton} sm:mr-auto">
					{pending === 'extract' ? 'Reading…' : 'Read it again'}
				</button>
				<a href="/resumes" class="{secondaryButton} text-center">Cancel</a>
				<button type="submit" disabled={!!pending} class="{primaryButton} sm:w-auto sm:px-6">
					{pending === 'import' ? 'Adding…' : 'Add to profile'}
				</button>
			</div>
			<p class="text-sm text-ink/55" aria-live="polite">{pending === 'extract' ? waiting : ''}</p>
		</form>
	{/if}
</div>
