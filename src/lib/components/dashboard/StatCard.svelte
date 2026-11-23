
<script lang="ts">
	let {
		title,
		value,
		description = '',
		variant = 'default',
		icon = 'document'
	}: {
		title: string;
		value: number | string;
		description?: string;
		variant?: 'default' | 'attention' | 'success';
		icon?: 'briefcase' | 'document' | 'clock' | 'calendar' | 'offer';
	} = $props();

	const accents = {
		default: 'bg-tide/10 text-tide-deep',
		attention: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
		success: 'bg-green-500/10 text-green-700 dark:text-green-300'
	};
</script>

<div
	class="group relative overflow-hidden rounded-2xl border border-ink/10
		bg-white/80 p-3 shadow-sm transition-all duration-200
		hover:-translate-y-1 hover:border-tide/30 hover:shadow-lg
		dark:bg-white/5 sm:p-5"
>
	<div class="flex items-center justify-between gap-3">
		<p class="min-w-0 text-xs font-medium leading-snug text-ink/65 sm:text-sm">
			{title}
		</p>

		<div class={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${accents[variant]}`}>
			<svg
				class="h-5 w-5 sm:h-6 sm:w-6"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				{#if icon === 'briefcase'}
					<rect x="3" y="7" width="18" height="14" rx="2" />
					<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
				{:else if icon === 'clock'}
					<circle cx="12" cy="12" r="9" />
					<path d="M12 7v5l3 2" />
				{:else if icon === 'calendar'}
					<rect x="3" y="5" width="18" height="16" rx="2" />
					<path d="M7 3v4M17 3v4M3 10h18m-13 6 3 3 5-6" />
				{:else if icon === 'offer'}
					<path d="M4 4h16v16H4zM8 9h8M8 13h5M8 17h8" />
					<path d="m14 16 2 2 4-4" />
				{:else}
					<rect x="5" y="3" width="14" height="18" rx="2" />
					<path d="M9 8h6M9 12h6M9 16h4" />
				{/if}
			</svg>
		</div>

	</div>

	<p class="mt-3 text-2xl font-bold tracking-tight text-ink tabular-nums sm:text-3xl">
		{value}
	</p>

	{#if description}
		<p class="mt-2 text-xs font-medium text-ink/55">
			{description}
		</p>
	{/if}

	<div
		class="absolute inset-x-0 bottom-0 h-1 bg-tide/0
			transition-colors duration-200 group-hover:bg-tide/60"
	></div>
</div>
