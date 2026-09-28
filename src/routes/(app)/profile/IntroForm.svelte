<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import FieldError from '$lib/components/FieldError.svelte';
	import SuggestInput from '$lib/components/SuggestInput.svelte';
	import { withPending } from '$lib/forms';
	import { LIMITS } from '$lib/profile-options';
	import type { Profile } from '$lib/server/db/schema';
	import { searchCities, searchCompanies } from '$lib/suggest.svelte';
	import { errorBox, field, hint, label } from '$lib/ui';
	import FormButtons from './FormButtons.svelte';

	let {
		user,
		profile: p,
		errors
	}: {
		user: { name: string; image?: string | null; role: 'job_seeker' | 'recruiter' };
		profile: Profile | null;
		errors?: Record<string, string>;
	} = $props();

	let pending = $state(false);
	let preview = $state<string | null>(null);
	let isSeeker = $derived(user.role === 'job_seeker');

	function previewAvatar(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		if (preview) URL.revokeObjectURL(preview);
		preview = file ? URL.createObjectURL(file) : null;
	}
</script>

<form
	method="post"
	action="?/intro"
	enctype="multipart/form-data"
	class="mt-6 space-y-5"
	use:enhance={withPending((v) => (pending = v))}
>
	<div class="flex items-center gap-4">
		<Avatar name={user.name} image={preview ?? user.image} />
		<label class="block min-w-0 flex-1">
			<span class={label}>Profile picture</span>
			<input
				type="file"
				name="avatar"
				accept="image/png,image/jpeg,image/webp"
				onchange={previewAvatar}
				aria-describedby="avatar-hint avatar-error"
				class="mt-1.5 block w-full text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/75 file:px-3 file:py-2 file:font-semibold file:text-tide hover:file:bg-white"
			/>
			<span id="avatar-hint" class={hint}>PNG, JPG or WebP, up to 2 MB.</span>
			<FieldError id="avatar-error" message={errors?.avatar} />
		</label>
	</div>

	<label class="block">
		<span class={label}>Full name</span>
		<input name="name" required maxlength={LIMITS.short} autocomplete="name" value={user.name} aria-invalid={!!errors?.name} aria-describedby="name-error" class={field} />
		<FieldError id="name-error" message={errors?.name} />
	</label>

	{#if isSeeker}
		<label class="block">
			<span class={label}>Headline</span>
			<input name="headline" maxlength={LIMITS.short} placeholder="3rd-year software engineering student" value={p?.headline ?? ''} aria-describedby="headline-error" class={field} />
			<FieldError id="headline-error" message={errors?.headline} />
		</label>
	{:else}
		<div class="grid gap-5 sm:grid-cols-2">
			<label class="block">
				<span class={label}>Company</span>
				<SuggestInput
					name="company"
					search={searchCompanies}
					domainName="companyDomain"
					value={p?.company}
					domain={p?.companyDomain}
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
				<span class={label}>Job title</span>
				<input name="jobTitle" maxlength={LIMITS.short} autocomplete="organization-title" placeholder="Talent acquisition lead" value={p?.jobTitle ?? ''} aria-describedby="jobTitle-error" class={field} />
				<FieldError id="jobTitle-error" message={errors?.jobTitle} />
			</label>
		</div>
	{/if}

	<div class="grid gap-5 sm:grid-cols-2">
		<label class="block">
			<span class={label}>Location</span>
			<SuggestInput name="location" search={searchCities} fixed={['Remote']} value={p?.location} maxlength={LIMITS.short} placeholder="Start typing a city" aria-describedby="location-error" class={field} />
			<FieldError id="location-error" message={errors?.location} />
		</label>
		<label class="block">
			<span class={label}>Phone number</span>
			<input type="tel" name="phone" maxlength={LIMITS.short} autocomplete="tel" placeholder="+1 514 555 0123" value={p?.phone ?? ''} aria-invalid={!!errors?.phone} aria-describedby="phone-error" class={field} />
			<FieldError id="phone-error" message={errors?.phone} />
		</label>
	</div>

	<fieldset class="space-y-5">
		<legend class="font-semibold">Links</legend>
		<label class="block">
			<span class={label}>LinkedIn</span>
			<input type="text" name="linkedinUrl" inputmode="url" maxlength={LIMITS.url} placeholder="https://linkedin.com/in/you" value={p?.linkedinUrl ?? ''} aria-describedby="linkedinUrl-error" class={field} />
			<FieldError id="linkedinUrl-error" message={errors?.linkedinUrl} />
		</label>
		{#if isSeeker}
			<label class="block">
				<span class={label}>GitHub</span>
				<input type="text" name="githubUrl" inputmode="url" maxlength={LIMITS.url} placeholder="https://github.com/you" value={p?.githubUrl ?? ''} aria-describedby="githubUrl-error" class={field} />
				<FieldError id="githubUrl-error" message={errors?.githubUrl} />
			</label>
		{/if}
		<label class="block">
			<span class={label}>{isSeeker ? 'Portfolio or website' : 'Company website'}</span>
			<input type="text" name="websiteUrl" inputmode="url" maxlength={LIMITS.url} placeholder="https://" value={p?.websiteUrl ?? ''} aria-describedby="websiteUrl-error" class={field} />
			<FieldError id="websiteUrl-error" message={errors?.websiteUrl} />
		</label>
	</fieldset>

	{#if errors}<p role="alert" class={errorBox}>Some fields need fixing before this can be saved.</p>{/if}
	<FormButtons {pending} />
</form>
