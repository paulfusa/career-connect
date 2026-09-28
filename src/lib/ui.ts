// Shared Tailwind class strings for the glass UI
export const glassPanel =
	'rounded-[28px] border border-white/60 bg-white/45 shadow-[0_24px_60px_-20px_rgba(27,38,56,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl backdrop-saturate-150';

export const field =
	'mt-1.5 block w-full rounded-xl border-white/70 bg-white/60 px-3.5 py-3 text-ink shadow-inner shadow-ink/5 placeholder:text-ink/35 transition focus:border-tide focus:bg-white/85 focus:ring-4 focus:ring-tide/15';

export const primaryButton =
	'w-full rounded-xl bg-tide py-3 font-semibold text-white shadow-lg shadow-tide/25 transition hover:bg-tide-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide active:scale-[0.99] disabled:opacity-70';

export const secondaryButton =
	'rounded-xl border border-white/70 bg-white/60 px-4 py-2.5 font-semibold text-ink transition hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide disabled:opacity-70';

export const errorBox = 'rounded-xl bg-rose-50/80 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200';

// native <dialog>; entrance animation lives in layout.css (.glass-dialog). Add a max-w-* at the use site.
export const glassDialog =
	'glass-dialog m-auto w-[calc(100%-2rem)] rounded-[28px] border border-white/60 bg-white/75 p-8 text-ink shadow-[0_30px_80px_-20px_rgba(27,38,56,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl backdrop-saturate-150 backdrop:bg-ink/15 backdrop:backdrop-blur-sm';

export const label = 'text-sm font-medium';
export const hint = 'mt-1.5 block text-xs text-ink/55';
export const successBox = 'rounded-xl bg-emerald-50/80 px-3.5 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200';

// checkbox/radio styled as a selectable pill (wrap the sr-only input in this label)
export const pill =
	'cursor-pointer rounded-full border border-white/70 bg-white/50 px-3.5 py-1.5 text-sm font-medium transition hover:bg-white/70 has-checked:border-tide has-checked:bg-tide/10 has-checked:text-tide-deep has-focus-visible:outline-2 has-focus-visible:outline-tide';
