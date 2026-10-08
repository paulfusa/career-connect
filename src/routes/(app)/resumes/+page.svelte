<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { formatBytes, RESUME_MAX_COUNT, RESUME_MAX_MB } from '$lib/resume';
	import type { Resume } from '$lib/server/db/schema';
	import { errorBox, glassPanel, primaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// which request is in flight: 'upload', or the id of the resume being replaced/deleted
	let busy = $state<string | null>(null);
	let confirming = $state<Resume | null>(null);

	const track = (key: string) => () => {
		busy = key;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update(); // re-runs load, so the list reflects the change immediately
			busy = null;
			confirming = null;
		};
	};

	let full = $derived(data.resumes.length >= RESUME_MAX_COUNT);
	const dateFmt = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' });
	const actionLink = 'rounded-lg px-2.5 py-1.5 text-sm font-medium text-tide hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-tide';
</script>

<svelte:head><title>Resumes · CareerConnect</title></svelte:head>

<div class="space-y-5 md:mt-14">
	<div>
		<h1 class="font-display text-3xl font-semibold tracking-tight">Resumes</h1>
		<p class="mt-2 text-ink/60">Keep your resumes here so they’re ready when you apply.</p>
	</div>

	<!-- one live region for every action's result -->
	<div aria-live="polite">
		{#if form && 'success' in form}
			<p role="status" class={successBox}>{form.success}</p>
		{:else if form?.error}
			<p role="alert" class={errorBox}>{form.error}</p>
		{/if}
	</div>

	<form
		method="post"
		action="?/upload"
		enctype="multipart/form-data"
		class="{glassPanel} p-6"
		use:enhance={track('upload')}
	>
		<h2 class="font-display text-xl font-semibold">Upload a resume</h2>
		<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
			<label class="block min-w-0 flex-1">
				<span class="sr-only">Resume PDF</span>
				<input
					type="file"
					name="file"
					accept="application/pdf,.pdf"
					required
					disabled={full}
					aria-describedby="upload-hint"
					class="block w-full text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/75 file:px-3.5 file:py-2.5 file:font-semibold file:text-tide hover:file:bg-white disabled:opacity-50"
				/>
			</label>
			<button type="submit" disabled={full || busy === 'upload'} class="{primaryButton} sm:w-auto sm:px-6">
				{busy === 'upload' ? 'Uploading…' : 'Upload'}
			</button>
		</div>
		<p id="upload-hint" class="mt-3 text-xs text-ink/55">
			{#if full}
				You have {RESUME_MAX_COUNT} resumes, the most you can keep. Delete one to upload another.
			{:else}
				PDF only, up to {RESUME_MAX_MB} MB. {data.resumes.length} of {RESUME_MAX_COUNT} used.
			{/if}
		</p>
	</form>

	<section class="{glassPanel} p-6">
		<h2 class="font-display text-xl font-semibold">Your resumes</h2>
		{#if data.resumes.length}
			<ul class="mt-2 divide-y divide-white/60">
				{#each data.resumes as r (r.id)}
					<li class="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 last:pb-0">
						<span class="grid size-11 shrink-0 place-items-center rounded-xl bg-white/80 text-xs font-bold text-rose-600 ring-1 ring-white" aria-hidden="true">PDF</span>
						<div class="min-w-0 flex-1">
							<a href="/resumes/{r.id}" target="_blank" rel="noopener" class="block truncate font-semibold hover:text-tide hover:underline">{r.fileName}</a>
							<p class="text-sm text-ink/55">
								{formatBytes(r.sizeBytes)}{' · '}{r.updatedAt > r.createdAt ? 'Replaced' : 'Uploaded'}
								{dateFmt.format(r.updatedAt)}
							</p>
						</div>
						<div class="flex items-center gap-1">
							<a href="/resumes/{r.id}" target="_blank" rel="noopener" class={actionLink} aria-label="View {r.fileName}">View</a>

							<!-- picking a file submits straight away -->
							<form method="post" action="?/replace" enctype="multipart/form-data" use:enhance={track(r.id)}>
								<input type="hidden" name="id" value={r.id} />
								<label class="{actionLink} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-tide {busy === r.id ? 'pointer-events-none opacity-60' : ''}">
									{busy === r.id ? 'Working…' : 'Replace'}
									<input
										type="file"
										name="file"
										accept="application/pdf,.pdf"
										class="sr-only"
										aria-label="Replace {r.fileName} with another PDF"
										onchange={(e) => e.currentTarget.files?.length && e.currentTarget.form?.requestSubmit()}
									/>
								</label>
							</form>

							<button
								type="button"
								onclick={() => (confirming = r)}
								aria-label="Delete {r.fileName}"
								class="rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50/80 focus-visible:outline-2 focus-visible:outline-rose-600"
							>
								Delete
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-3 text-ink/45">You haven’t uploaded a resume yet.</p>
		{/if}
	</section>
</div>

{#if confirming}
	<ConfirmDialog
		title="Delete this resume?"
		message="{confirming.fileName} will be permanently deleted. This can’t be undone."
		oncancel={() => (confirming = null)}
	>
		<form method="post" action="?/delete" use:enhance={track(confirming.id)}>
			<input type="hidden" name="id" value={confirming.id} />
			<button
				disabled={busy === confirming.id}
				class="w-full rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-70"
			>
				{busy === confirming.id ? 'Deleting…' : 'Delete resume'}
			</button>
		</form>
	</ConfirmDialog>
{/if}
