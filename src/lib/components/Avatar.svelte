<script lang="ts">
	let { name, image, size = 'md' }: { name: string; image?: string | null; size?: 'sm' | 'md' | 'lg' } = $props();

	let initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0].toUpperCase())
			.join('')
	);
	const sizes = { sm: 'size-10 text-sm ring-2', md: 'size-14 text-lg ring-4', lg: 'size-24 text-3xl ring-4' };
</script>

{#if image}
	<img src={image} alt="" class="{sizes[size]} shrink-0 rounded-full object-cover ring-white/70" />
{:else}
	<span
		aria-hidden="true"
		class="{sizes[size]} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky to-lilac font-display font-semibold text-ink/80 ring-white/70"
	>
		{initials}
	</span>
{/if}
