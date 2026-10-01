<script lang="ts">
	let { data, form } = $props();
</script>

<div class="mx-auto mt-20 max-w-md rounded-lg border p-6 shadow-sm">
	<h1 class="mb-3 text-2xl font-semibold">
		Check your email
	</h1>

	<p class="mb-4 text-gray-600">
		We sent a verification link to your email address.
		Please verify your email before signing in.
	</p>

	{#if data.email}
		<p class="mb-6 font-medium">
			{data.email}
		</p>
	{/if}

	{#if form?.message}
		<p class="mb-4 text-green-600">
			{form.message}
		</p>
	{/if}

	{#if form?.error}
		<p class="mb-4 text-red-600">
			{form.error}
		</p>
	{/if}

	<form method="POST" action="?/resend">
		<input
			type="hidden"
			name="email"
			value={data.email}
		/>

		<button
			type="submit"
			class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
		>
			Resend verification email
		</button>
	</form>

	<a
		href="/login"
		class="mt-4 block text-center text-sm text-blue-600 hover:underline"
	>
		Back to login
	</a>
</div>