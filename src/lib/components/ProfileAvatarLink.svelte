<script lang="ts">
	import Avatar from './Avatar.svelte';

	// US-19: small round photo that links to the person's profile.
	// relative z-10 so it stays clickable on the job cards (the title link covers the whole card)
	let { id, name, image }: { id: string; name: string; image?: string | null } = $props();
</script>

<a
	href="/profile/{id}"
	title={name}
	aria-label="View {name}'s profile"
	class="relative z-10 shrink-0 rounded-full transition hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
>
	<Avatar {name} {image} size="sm" />
</a>
