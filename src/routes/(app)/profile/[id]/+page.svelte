<script lang="ts">
	import ProfileView from '$lib/components/ProfileView.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>{data.target.name} · CareerConnect</title></svelte:head>

<div class="md:mt-14">
	<ProfileView user={data.target} profile={data.targetProfile} experience={data.experience} education={data.education} />
</div>
