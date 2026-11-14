<script lang="ts">
	import Avatar from './Avatar.svelte';

	// US-19: someone's photo in a small circle, click it to open their profile.
	// relative z-10 keeps it clickable on the job cards, where the title link covers the whole card
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
