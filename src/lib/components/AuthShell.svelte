<script lang="ts" module>
	export const field =
		'mt-1.5 block w-full rounded-xl border-white/70 bg-white/60 px-3.5 py-3 text-ink shadow-inner shadow-ink/5 placeholder:text-ink/35 transition focus:border-tide focus:bg-white/85 focus:ring-4 focus:ring-tide/15';

	export const primaryButton =
		'w-full rounded-xl bg-tide py-3 font-semibold text-white shadow-lg shadow-tide/25 transition hover:bg-tide-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide active:scale-[0.99] disabled:opacity-70';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		children,
		footer
	}: { title: string; subtitle: string; children: Snippet; footer?: Snippet } = $props();
</script>

<main class="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
	<!-- morning light drifting behind the glass -->
	<div aria-hidden="true" class="pointer-events-none absolute inset-0">
		<div class="blob -top-24 -left-20 size-[28rem] bg-peach"></div>
		<div class="blob top-1/3 -right-24 size-[32rem] bg-sky [animation-delay:-6s]"></div>
		<div class="blob -bottom-32 left-1/4 size-[26rem] bg-lilac [animation-delay:-12s]"></div>
	</div>

	<div class="enter relative w-full max-w-sm">
		<p class="mb-6 font-display text-2xl font-semibold tracking-tight">
			Career<span class="text-tide">Connect</span>
		</p>

		<section
			class="rounded-[28px] border border-white/60 bg-white/45 p-8 shadow-[0_24px_60px_-20px_rgba(27,38,56,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl backdrop-saturate-150"
		>
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
	.blob {
		position: absolute;
		border-radius: 9999px;
		filter: blur(70px);
		opacity: 0.75;
		animation: drift 24s ease-in-out infinite alternate;
	}

	@keyframes drift {
		to {
			transform: translate(3rem, -2rem) scale(1.12);
		}
	}

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
		.blob,
		.enter {
			animation: none;
		}
	}
</style>
