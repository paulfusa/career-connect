
<!-- Soft animated background gradients -->
<div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div class="blob -top-24 -left-20 size-112 bg-peach"></div>
    <div class="blob top-1/3 -right-24 size-128 bg-sky [animation-delay:-6s]"></div>
    <div class="blob -bottom-32 left-1/4 size-104 bg-lilac [animation-delay:-12s]"></div>
</div>

<style>
    .blob {
        position: absolute;
        border-radius: 9999px;
        filter: blur(70px);
        opacity: 0.75;
        animation: drift 24s ease-in-out infinite alternate;
    }

    /* US-21: Subtle gradients in dark mode */
    :global(html.dark) .blob {
        opacity: 0.10;
        filter: blur(110px) brightness(0.65);
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
