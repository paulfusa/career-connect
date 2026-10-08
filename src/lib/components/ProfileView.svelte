<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Education, Experience, Profile } from '$lib/server/db/schema';
	import { EMPLOYMENT_TYPES, JOB_TYPES, WORK_MODES } from '$lib/profile-options';
	import { glassPanel, secondaryButton } from '$lib/ui';
	import Avatar from './Avatar.svelte';
	import OrgLogo from './OrgLogo.svelte';

	// Read-only profile, used on your own /profile (editable: edit links) and by recruiters (/profile/[id])
	let {
		user,
		profile: p,
		experience,
		education,
		editable = false,
		resumes,
		below
	}: {
		user: { name: string; email: string; image?: string | null; role: 'job_seeker' | 'recruiter' };
		profile: Profile | null;
		experience: Experience[];
		education: Education[];
		editable?: boolean;
		resumes?: { id: string; fileName: string }[];
		below?: Snippet; // rendered under the header card (e.g. completeness)
	} = $props();

	let isSeeker = $derived(user.role === 'job_seeker');
	let tagline = $derived(isSeeker ? p?.headline : [p?.jobTitle, p?.company].filter(Boolean).join(' at '));
	let links = $derived(
		[
			['LinkedIn', p?.linkedinUrl],
			['GitHub', p?.githubUrl],
			['Website', p?.websiteUrl]
		].filter((l): l is [string, string] => !!l[1])
	);
	let otherSkills = $derived(p?.skills.filter((s) => !p?.topSkills.includes(s)) ?? []);
	let hasPreferences = $derived(
		!!p && (p.openToWork || [p.desiredRoles, p.jobTypes, p.workModes, p.preferredLocations].some((l) => l.length))
	);

	let preferenceRows = $derived<[string, string[]][]>(
		p
			? [
					['Roles', p.desiredRoles],
					['Job types', p.jobTypes.map((t) => JOB_TYPES[t as keyof typeof JOB_TYPES])],
					['Work mode', p.workModes.map((m) => WORK_MODES[m as keyof typeof WORK_MODES])],
					['Locations', p.preferredLocations]
				]
			: []
	);

	const monthFmt = new Intl.DateTimeFormat('en-CA', { month: 'short', year: 'numeric', timeZone: 'UTC' });
	const month = (d: string) => monthFmt.format(new Date(`${d}T00:00:00Z`));
	function duration(start: string, end: string | null) {
		const a = new Date(start);
		const b = end ? new Date(end) : new Date();
		const months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth() + 1;
		const y = Math.floor(months / 12);
		const m = months % 12;
		return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
	}
	const years = (e: Education) => [e.startYear, e.endYear].filter(Boolean).join(' – ');

	const editLink = 'rounded-lg px-2.5 py-1 text-sm font-medium text-tide hover:bg-white/70';
	const chip = 'rounded-full bg-white/70 px-3 py-1 text-sm ring-1 ring-white';
</script>

{#snippet section(title: string, action: { href: string; label: string } | null, body: Snippet)}
	<section class="{glassPanel} p-6">
		<div class="flex items-center justify-between gap-3">
			<h2 class="font-display text-xl font-semibold">{title}</h2>
			{#if editable && action}
				<a href={action.href} class={editLink}>{action.label}</a>
			{/if}
		</div>
		<div class="mt-4">{@render body()}</div>
	</section>
{/snippet}

{#snippet empty(text: string)}
	<p class="text-ink/45">{editable ? text : 'Nothing added yet.'}</p>
{/snippet}

<div class="space-y-5">
	<header class="{glassPanel} p-6">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-start">
			<Avatar name={user.name} image={user.image} size="lg" />
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
					<h1 class="font-display text-3xl font-semibold tracking-tight">{user.name}</h1>
					{#if isSeeker && p?.openToWork}
						<span class="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
							Open to work
						</span>
					{/if}
				</div>
				{#if tagline}<p class="mt-1 text-ink/75">{tagline}</p>{/if}
				<p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/55">
					{#if p?.location}<span>{p.location}</span>{/if}
					<a href="mailto:{user.email}" class="hover:text-tide">{user.email}</a>
					{#if p?.phone}<a href="tel:{p.phone}" class="hover:text-tide">{p.phone}</a>{/if}
				</p>
				{#if links.length}
					<p class="mt-3 flex flex-wrap gap-2">
						{#each links as [label, href] (label)}
							<a {href} target="_blank" rel="noopener noreferrer" class="{chip} font-medium text-tide hover:bg-white">{label}</a>
						{/each}
					</p>
				{/if}
			</div>
			{#if editable}
				<a href="?edit=intro" class="{secondaryButton} self-start">Edit intro</a>
			{/if}
		</div>
		{@render below?.()}
	</header>

	{#snippet aboutBody()}
		{#if p?.about}
			<p class="whitespace-pre-line text-ink/85">{p.about}</p>
		{:else}
			{@render empty(isSeeker ? 'Tell recruiters who you are and what you’re looking for.' : 'Tell candidates about you and your team.')}
		{/if}
	{/snippet}
	{@render section('About', { href: '?edit=about', label: p?.about ? 'Edit' : 'Add' }, aboutBody)}

	{#if isSeeker}
		{#snippet experienceBody()}
			{#if experience.length}
				<ul class="divide-y divide-white/60">
					{#each experience as e (e.id)}
						<li class="flex gap-4 py-4 first:pt-0 last:pb-0">
							<OrgLogo name={e.company} domain={e.companyDomain} />
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="font-semibold">{e.title}</p>
										<p class="text-ink/75">
											{e.company}{#if e.employmentType}<span class="text-ink/50">{' · '}{EMPLOYMENT_TYPES[e.employmentType as keyof typeof EMPLOYMENT_TYPES]}</span>{/if}
										</p>
									</div>
									{#if editable}<a href="?experience={e.id}" class={editLink}>Edit</a>{/if}
								</div>
								<p class="mt-0.5 text-sm text-ink/55">
									{month(e.startDate)} – {e.endDate ? month(e.endDate) : 'Present'} · {duration(e.startDate, e.endDate)}{#if e.location}<br />{e.location}{/if}
								</p>
								{#if e.description}<p class="mt-2 whitespace-pre-line text-sm text-ink/80">{e.description}</p>{/if}
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				{@render empty('Add internships, jobs, co-ops or volunteer work.')}
			{/if}
		{/snippet}
		{@render section('Experience', { href: '?experience=new', label: 'Add' }, experienceBody)}

		{#snippet educationBody()}
			{#if education.length}
				<ul class="divide-y divide-white/60">
					{#each education as e (e.id)}
						<li class="flex gap-4 py-4 first:pt-0 last:pb-0">
							<OrgLogo name={e.school} domain={e.schoolDomain} />
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="font-semibold">{e.school}</p>
										{#if e.degree || e.fieldOfStudy}
											<p class="text-ink/75">{[e.degree, e.fieldOfStudy].filter(Boolean).join(', ')}</p>
										{/if}
									</div>
									{#if editable}<a href="?education={e.id}" class={editLink}>Edit</a>{/if}
								</div>
								{#if years(e)}<p class="mt-0.5 text-sm text-ink/55">{years(e)}</p>{/if}
								{#if e.description}<p class="mt-2 whitespace-pre-line text-sm text-ink/80">{e.description}</p>{/if}
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				{@render empty('Add your school, CEGEP or university.')}
			{/if}
		{/snippet}
		{@render section('Education', { href: '?education=new', label: 'Add' }, educationBody)}

		{#snippet skillsBody()}
			{#if p?.skills.length}
				{#if p.topSkills.length}
					<p class="text-xs text-ink/55">Top skills</p>
					<ul class="mt-2 flex flex-wrap gap-2">
						{#each p.topSkills as skill (skill)}
							<li class="rounded-full bg-tide/10 px-3 py-1 text-sm font-medium text-tide-deep ring-1 ring-tide/30">{skill}</li>
						{/each}
					</ul>
				{/if}
				{#if otherSkills.length}
					<ul class="flex flex-wrap gap-2 {p.topSkills.length ? 'mt-4' : ''}">
						{#each otherSkills as skill (skill)}<li class={chip}>{skill}</li>{/each}
					</ul>
				{/if}
			{:else}
				{@render empty('Add skills so recruiters and job matches can find you.')}
			{/if}
		{/snippet}
		{@render section('Skills', { href: '?edit=skills', label: p?.skills.length ? 'Edit' : 'Add' }, skillsBody)}

		{#snippet preferencesBody()}
			{#if hasPreferences && p}
				<dl class="grid gap-4 sm:grid-cols-2">
					<div>
						<dt class="text-xs text-ink/55">Status</dt>
						<dd class="mt-0.5">{p.openToWork ? 'Open to work' : 'Not actively looking'}</dd>
					</div>
					{#each preferenceRows as [label, list] (label)}
						{#if list.length}
							<div>
								<dt class="text-xs text-ink/55">{label}</dt>
								<dd class="mt-0.5">{list.join(', ')}</dd>
							</div>
						{/if}
					{/each}
				</dl>
			{:else}
				{@render empty('Tell us what you’re looking for to get better job matches.')}
			{/if}
		{/snippet}
		{@render section('Job preferences', { href: '?edit=preferences', label: hasPreferences ? 'Edit' : 'Add' }, preferencesBody)}

		<!-- only on your own profile: recruiters get resumes through job applications, not here -->
		{#if resumes}
			{#snippet resumeBody()}
				{#if resumes.length}
					<ul class="space-y-2">
						{#each resumes as r (r.id)}
							<li>
								<a href="/resumes/{r.id}" target="_blank" rel="noopener" class="font-medium text-tide hover:underline">{r.fileName}</a>
							</li>
						{/each}
					</ul>
				{:else}
					{@render empty('Upload a PDF resume so it’s ready when you apply.')}
				{/if}
			{/snippet}
			{@render section('Resumes', { href: '/resumes', label: resumes.length ? 'Manage' : 'Upload' }, resumeBody)}
		{/if}
	{/if}
</div>
