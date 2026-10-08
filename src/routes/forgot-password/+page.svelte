
<script lang="ts">
  import AuthShell from '$lib/components/AuthShell.svelte';
  import { field, primaryButton } from '$lib/ui';

  let email = $state('');

  import type { ActionData } from './$types';

let { form }: { form: ActionData } = $props();

import { enhance } from '$app/forms';
import { onMount } from 'svelte';


let secondsLeft = $state(0);

const cooldownKey = (address: string) =>
  `password-reset-cooldown:${address.trim().toLowerCase()}`;

function updateCountdown() {
  const savedUntil = Number(
    sessionStorage.getItem(cooldownKey(email)) ?? 0
  );

  secondsLeft = Math.max(
    0,
    Math.ceil((savedUntil - Date.now()) / 1000)
  );
}

let hasRequestedCode = $state(false);

onMount(() => {
  email = sessionStorage.getItem('reset-email') ?? email;

  hasRequestedCode =
  sessionStorage.getItem('reset-code-requested') === 'true';

  updateCountdown();

  const timer = setInterval(updateCountdown, 1000);

  return () => clearInterval(timer);
});

function startCooldown() {
  sessionStorage.setItem('reset-email', email);

  hasRequestedCode = true;
  sessionStorage.setItem('reset-code-requested', 'true');

  sessionStorage.setItem(
    cooldownKey(email),
    String(Date.now() + 60000)
  );

  updateCountdown();
}


</script>

<svelte:head>
  <title>Forgot password · CareerConnect</title>
</svelte:head>

<AuthShell
  title="Forgot password?"
  subtitle="Enter your email address to request a password reset code."
>
  
  <form
    class="mt-8 space-y-5"
    method="POST"
    use:enhance={() => {
      return async ({ result, update }) => {
        await update({ reset: false });

        if (result.type === 'success') {
          startCooldown();
        }
      };
    }}
  >

    <label class="block">
      <span class="text-sm font-medium">Email</span>
      <input
        type="email"
        name="email"
        bind:value={email}
        autocomplete="email"
        placeholder="you@example.com"
        required
        class={field}
      />
    </label>

      
      <button
        type="submit"
        class={`${primaryButton} disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none`}
        disabled={secondsLeft > 0}
      >
        {#if secondsLeft > 0}
          Resend code in {secondsLeft}s
        {:else if form?.message}
          Resend code
        {:else}
          Send reset code
        {/if}
      </button>

  </form>
  
{#if hasRequestedCode && email}
  <div class="mt-4 text-center">
    <a
      href={`/reset-password?email=${encodeURIComponent(email)}`}
      class="text-sm font-semibold text-tide underline-offset-4 hover:underline"
    >
      Continue to reset password
    </a>
  </div>
{/if}


  
{#if form?.error}
  <p role="alert" class="mt-4 text-sm text-red-600">
    {form.error}
  </p>
{/if}

{#if form?.message}
  <div class="mt-4 rounded-lg border p-4">
    <p role="status" class="text-sm">
      {form.message}
    </p>
  </div>
{/if}


  {#snippet footer()}
    Remember your password?
    <a
      href="/login"
      class="font-semibold text-tide underline-offset-4 hover:underline"
    >
      Back to login
    </a>
  {/snippet}
</AuthShell>
