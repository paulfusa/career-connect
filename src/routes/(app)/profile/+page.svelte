<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import EditDialog from '$lib/components/EditDialog.svelte';
	import PasswordField from '$lib/components/PasswordField.svelte';
	import ProfileView from '$lib/components/ProfileView.svelte';
	import { completeness } from '$lib/completeness';
	import { withPending } from '$lib/forms';
	import { errorBox, field, glassPanel, label, secondaryButton, successBox } from '$lib/ui';
	import AboutForm from './AboutForm.svelte';
	import EducationForm from './EducationForm.svelte';
	import ExperienceForm from './ExperienceForm.svelte';
	import IntroForm from './IntroForm.svelte';
	import PreferencesForm from './PreferencesForm.svelte';
	import SkillsForm from './SkillsForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let p = $derived(data.profile);
	let isSeeker = $derived(data.user.role === 'job_seeker');

	// which editor is open comes from the URL: ?edit=intro|about|skills|preferences, ?experience=new|<id>, ?education=new|<id>
	let params = $derived(page.url.searchParams);
	let edit = $derived(params.get('edit'));
	let experienceParam = $derived(isSeeker ? params.get('experience') : null);
	let educationParam = $derived(isSeeker ? params.get('education') : null);
	let experienceEntry = $derived(data.experience.find((e) => e.id === experienceParam) ?? null);
	let educationEntry = $derived(data.education.find((e) => e.id === educationParam) ?? null);

	const errorsFor = (section: string) =>
		form && 'errors' in form && form.section === section ? (form.errors as Record<string, string>) : undefined;
	const resultFor = (section: string) => (form?.section === section ? form : null);

	let score = $derived(
		completeness(data.user.role, data.user.image, p, {
			experience: data.experience.length,
			education: data.education.length
		})
	);

	let pending = $state<string | null>(null);
	const track = (name: string, reset = true) => withPending((v) => (pending = v ? name : null), reset);
</script>

<svelte:head><title>Profile · CareerConnect</title></svelte:head>

{#snippet below()}
	{#if score.percent < 100}
		<div class="mt-6 border-t border-white/60 pt-5">
			<div class="flex items-center justify-between text-sm">
				<span class="font-medium">Profile {score.percent}% complete</span>
				{#if score.next}<span class="text-ink/55">Next: {score.next}</span>{/if}
			</div>
			<div class="mt-2 h-2 overflow-hidden rounded-full bg-white/60" role="progressbar" aria-valuenow={score.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
				<div class="h-full rounded-full bg-tide transition-[width] duration-500" style="width: {score.percent}%"></div>
			</div>
		</div>
	{/if}
{/snippet}

<div class="space-y-5 md:mt-14">
	{#if params.has('saved') && !edit && !experienceParam && !educationParam}
		<p role="status" class={successBox}>Profile saved.</p>
	{/if}

	<ProfileView user={data.user} profile={p} experience={data.experience} education={data.education} editable {below} />

	<h2 class="pt-4 font-display text-xl font-semibold">Account</h2>
	<div class="grid gap-5 lg:grid-cols-2">
		{#snippet emailForm()}
			{@const r = resultFor('email')}
			<form method="post" action="?/email" class="{glassPanel} space-y-4 p-6" use:enhance={track('email', false)}>
				<h3 class="font-semibold">Email</h3>
				<label class="block">
					<span class={label}>Email address</span>
					<input type="email" name="email" required autocomplete="email" value={r && 'email' in r ? r.email : data.user.email} class={field} />
				</label>
				{#if r && 'message' in r}
					<p role="alert" class={errorBox}>{r.message}</p>
				{:else if r}
					<p role="status" class={successBox}>Email updated.</p>
				{/if}
				<button disabled={pending === 'email'} class={secondaryButton}>{pending === 'email' ? 'Saving…' : 'Change email'}</button>
			</form>
		{/snippet}
		{@render emailForm()}

		{#snippet passwordForm()}
			{@const r = resultFor('password')}
			<form method="post" action="?/password" class="{glassPanel} space-y-4 p-6" use:enhance={track('password')}>
				<h3 class="font-semibold">Password</h3>
				<PasswordField name="currentPassword" label="Current password" autocomplete="current-password" />
				<PasswordField name="newPassword" label="New password" autocomplete="new-password" hint="At least 8 characters." />
				<PasswordField name="confirmPassword" label="Confirm new password" autocomplete="new-password" />
				{#if r && 'message' in r}
					<p role="alert" class={errorBox}>{r.message}</p>
				{:else if r}
					<p role="status" class={successBox}>Password changed. You’ve been logged out on other devices.</p>
				{/if}
				<button disabled={pending === 'password'} class={secondaryButton}>{pending === 'password' ? 'Saving…' : 'Change password'}</button>
			</form>
		{/snippet}
		{@render passwordForm()}
	</div>

	{#snippet deleteForm()}
		{@const r = resultFor('delete')}
		<details class="{glassPanel} group p-6" open={!!r}>
			<summary class="cursor-pointer font-semibold text-rose-700 marker:text-rose-400">Delete account</summary>
			<form method="post" action="?/deleteAccount" class="mt-4 max-w-md space-y-4" use:enhance={track('delete')}>
				<p class="text-sm text-ink/70">
					This permanently deletes your account, profile, experience and education. It can’t be undone.
				</p>
				<label class="block">
					<span class={label}>Type DELETE to confirm</span>
					<input name="confirm" required autocomplete="off" pattern="DELETE" class={field} />
				</label>
				<PasswordField autocomplete="current-password" />
				{#if r && 'message' in r}<p role="alert" class={errorBox}>{r.message}</p>{/if}
				<button
					disabled={pending === 'delete'}
					class="rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-70"
				>
					{pending === 'delete' ? 'Deleting…' : 'Delete my account'}
				</button>
			</form>
		</details>
	{/snippet}
	{@render deleteForm()}
</div>

{#if edit === 'intro'}
	<EditDialog title="Edit intro"><IntroForm user={data.user} profile={p} errors={errorsFor('intro')} /></EditDialog>
{:else if edit === 'about'}
	<EditDialog title="About"><AboutForm about={p?.about ?? null} {isSeeker} errors={errorsFor('about')} /></EditDialog>
{:else if edit === 'skills' && isSeeker}
	<EditDialog title="Skills"><SkillsForm skills={p?.skills ?? []} topSkills={p?.topSkills ?? []} errors={errorsFor('skills')} /></EditDialog>
{:else if edit === 'preferences' && isSeeker}
	<EditDialog title="Job preferences"><PreferencesForm profile={p} errors={errorsFor('preferences')} /></EditDialog>
{:else if experienceParam === 'new' || experienceEntry}
	<EditDialog title={experienceEntry ? 'Edit experience' : 'Add experience'}>
		<ExperienceForm entry={experienceEntry} errors={errorsFor('experience')} />
	</EditDialog>
{:else if educationParam === 'new' || educationEntry}
	<EditDialog title={educationEntry ? 'Edit education' : 'Add education'}>
		<EducationForm entry={educationEntry} errors={errorsFor('education')} />
	</EditDialog>
{/if}
