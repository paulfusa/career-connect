<script lang="ts">
	let { name, image, size = 'md' }: { name: string; image?: string | null; size?: 'md' | 'lg' } = $props();

	let initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0].toUpperCase())
			.join('')
	);
	const sizes = { md: 'size-14 text-lg', lg: 'size-24 text-3xl' };
</script>

{#if image}
	<img src={image} alt="" class="{sizes[size]} shrink-0 rounded-full object-cover ring-4 ring-white/70" />
{:else}
	<span
		aria-hidden="true"
		class="{sizes[size]} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky to-lilac font-display font-semibold text-ink/80 ring-4 ring-white/70"
	>
		{initials}
	</span>
{/if}
