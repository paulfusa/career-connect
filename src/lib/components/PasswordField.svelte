<script lang="ts">
	import { field } from './AuthShell.svelte';

	let {
		autocomplete,
		hint
	}: { autocomplete: 'current-password' | 'new-password'; hint?: string } = $props();

	let show = $state(false);
</script>

<label class="block">
	<span class="text-sm font-medium">Password</span>
	<span class="relative block">
		<input
			type={show ? 'text' : 'password'}
			name="password"
			{autocomplete}
			required
			minlength={autocomplete === 'new-password' ? 8 : undefined}
			aria-describedby={hint ? 'password-hint' : undefined}
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
		<span id="password-hint" class="mt-1.5 block text-xs text-ink/55">{hint}</span>
	{/if}
</label>
