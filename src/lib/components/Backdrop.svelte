<!-- morning light drifting behind the glass -->
<div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
	<div class="blob -top-24 -left-20 size-[28rem] bg-peach"></div>
	<div class="blob top-1/3 -right-24 size-[32rem] bg-sky [animation-delay:-6s]"></div>
	<div class="blob -bottom-32 left-1/4 size-[26rem] bg-lilac [animation-delay:-12s]"></div>
</div>

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

	@media (prefers-reduced-motion: reduce) {
		.blob {
			animation: none;
		}
	}
</style>
