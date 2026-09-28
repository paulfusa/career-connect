<script lang="ts">
	import type { Snippet } from 'svelte';
	import Backdrop from './Backdrop.svelte';
	import { glassPanel } from '$lib/ui';

	let {
		title,
		subtitle,
		children,
		footer
	}: { title: string; subtitle: string; children: Snippet; footer?: Snippet } = $props();
</script>

<Backdrop />

<main class="grid min-h-dvh place-items-center px-4 py-12">
	<div class="enter w-full max-w-sm">
		<p class="mb-6 font-display text-2xl font-semibold tracking-tight">
			Career<span class="text-tide">Connect</span>
		</p>

		<section class="{glassPanel} p-8">
			<h1 class="font-display text-3xl font-semibold tracking-tight">{title}</h1>
			<p class="mt-1.5 text-ink/65">{subtitle}</p>
			{@render children()}
		</section>

		{#if footer}
			<p class="mt-6 text-center text-sm text-ink/70">{@render footer()}</p>
		{/if}
	</div>
</main>

<style>
	.enter {
		animation: enter 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	@keyframes enter {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.enter {
			animation: none;
		}
	}
</style>
