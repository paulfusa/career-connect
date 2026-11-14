<script lang="ts">
	import { enhance } from '$app/forms';
	import ProfileView from '$lib/components/ProfileView.svelte';
	import { errorBox, primaryButton, secondaryButton, successBox } from '$lib/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>{data.target.name} · CareerConnect</title></svelte:head>

<!-- US-19: follower count and the Follow / Unfollow button, under the profile card -->
{#snippet below()}
	<div class="mt-6 flex flex-wrap items-center gap-4 border-t border-white/60 pt-5">
		<p class="text-sm text-ink/70">
			<span class="font-semibold text-ink">{data.followers}</span>
			{data.followers === 1 ? 'follower' : 'followers'}
		</p>
		<form method="POST" action={data.following ? '?/unfollow' : '?/follow'} use:enhance>
			<!-- min-w-28 so the button stays the same size when it switches between Follow and Unfollow -->
			<button type="submit" class={data.following ? secondaryButton + ' min-w-28' : primaryButton + ' min-w-28 px-6'}>
				{data.following ? 'Unfollow' : 'Follow'}
			</button>
		</form>
	</div>
	{#if form?.message}
		<p class="{errorBox} mt-4" role="alert">{form.message}</p>
	{:else if form?.success}
		<p class="{successBox} mt-4" role="status">{form.success}</p>
	{/if}
{/snippet}

<div class="space-y-5 md:mt-14">
	<ProfileView user={data.target} profile={data.targetProfile} experience={data.experience} education={data.education} {below} />

	{#if data.target.role === 'recruiter'}
		<section>
			<h2 class="font-display text-xl font-semibold">Latest jobs</h2>
			{#if data.jobs.length}
				<ul class="mt-3 space-y-2">
					{#each data.jobs as job (job.id)}
						<li>
							<a href="/jobs/{job.id}" class="font-medium text-tide-deep hover:underline">{job.title}</a>
							<span class="text-sm text-ink/60">· {job.location} · Posted {job.createdAt.toLocaleDateString()}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 text-sm text-ink/60">No published jobs yet.</p>
			{/if}
		</section>
	{/if}
</div>
