
<script lang="ts">
	let {
		title,
		value
	}: {
		title: string;
		value: number | string;
	} = $props();
</script>

<div
	class="rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-sm
		transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
		dark:bg-white/5 sm:p-6"
>
	<p class="text-sm font-medium text-ink/60">
		{title}
	</p>

	<p class="mt-5 text-3xl font-bold tracking-tight text-ink">
		{value}
	</p>
</div>
