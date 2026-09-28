<script lang="ts">
	import { field } from '$lib/ui';

	let {
		autocomplete,
		hint,
		name = 'password',
		label = 'Password'
	}: {
		autocomplete: 'current-password' | 'new-password';
		hint?: string;
		name?: string;
		label?: string;
	} = $props();

	let show = $state(false);
</script>

<label class="block">
	<span class="text-sm font-medium">{label}</span>
	<span class="relative block">
		<input
			type={show ? 'text' : 'password'}
			{name}
			{autocomplete}
			required
			minlength={autocomplete === 'new-password' ? 8 : undefined}
			aria-describedby={hint ? `${name}-hint` : undefined}
			class="{field} pr-16"
		/>
		<button
			type="button"
			onclick={() => (show = !show)}
			aria-pressed={show}
			class="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2.5 text-sm font-medium text-tide hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-tide"
		>
			{show ? 'Hide' : 'Show'}
		</button>
	</span>
	{#if hint}
		<span id="{name}-hint" class="mt-1.5 block text-xs text-ink/55">{hint}</span>
	{/if}
</label>
