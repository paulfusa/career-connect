

<script lang="ts">
  import AuthShell from '$lib/components/AuthShell.svelte';
  import { field, primaryButton } from '$lib/ui';
  import type { ActionData } from './$types';
  import PasswordField from '$lib/components/PasswordField.svelte';
  import { page } from '$app/state';

    let { form }: { form: ActionData } = $props();

  import { onMount } from 'svelte';

    let secondsLeft = $state(0);
    let resending = $state(false);
    let resendMessage = $state('');

    const resetEmail = $derived(
      form?.email ?? page.url.searchParams.get('email') ?? ''
    );

    function updateCountdown() {
      if (!resetEmail) return;

      const savedUntil = Number(
        sessionStorage.getItem(
          `password-reset-cooldown:${resetEmail.trim().toLowerCase()}`
        ) ?? 0
      );

      secondsLeft = Math.max(
        0,
        Math.ceil((savedUntil - Date.now()) / 1000)
      );
    }

    onMount(() => {
      updateCountdown();

      const timer = setInterval(updateCountdown, 1000);

      return () => clearInterval(timer);
    });

    async function resendCode() {
      updateCountdown();

      if (secondsLeft > 0 || resending || !resetEmail) return;

      resending = true;
      resendMessage = '';

      try {
        const response = await fetch('/forgot-password', {
          method: 'POST',
          body: new URLSearchParams({
            email: resetEmail
          })
        });

        if (!response.ok) {
          resendMessage = 'Unable to request a code. Please try again.';
          return;
        }

        sessionStorage.setItem(
          `password-reset-cooldown:${resetEmail.trim().toLowerCase()}`,
          String(Date.now() + 60000)
        );

        updateCountdown();

        resendMessage =
          'If an account exists with this email, you will receive a reset code.';
      } catch {
        resendMessage = 'Unable to request a code. Please try again.';
      } finally {
        resending = false;
      }
    }
</script>

<svelte:head>
  <title>Reset password · CareerConnect</title>
</svelte:head>

<AuthShell
  title="Reset password"
  subtitle="Enter the code from your email and choose a new password."
>
  <form method="POST" class="mt-8 space-y-5">
    
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">
        Email address
      </span>

      <a
        href="/forgot-password"
        class="text-sm font-semibold text-tide hover:underline"
      >
        Edit email
      </a>
    </div>

    <p class="text-sm">
      {form?.email ?? page.url.searchParams.get('email') ?? ''}
    </p>

    <input
      type="hidden"
      name="email"
      value={form?.email ?? page.url.searchParams.get('email') ?? ''}
    />
  </div>


    <label class="block">
      <span class="text-sm font-medium">6-digit reset code</span>
      <input
        type="text"
        name="otp"
        inputmode="numeric"
        maxlength="6"
        placeholder="123456"
        required
        class={field}
      />
    </label>

          <PasswordField
        name="password"
        label="New password"
        autocomplete="new-password"
      />

      <PasswordField
        name="confirmPassword"
        label="Confirm new password"
        autocomplete="new-password"
      />

    {#if form?.error}
      <p role="alert" class="text-sm text-red-600">
        {form.error}
      </p>
    {/if}

    <button type="submit" class={primaryButton}>
      Reset password
    </button>

    
    <div class="space-y-3 text-center">
      <p class="text-sm">
        Didn't receive a code?
      </p>

      <button
        type="button"
        onclick={resendCode}
        disabled={secondsLeft > 0 || resending || !resetEmail}
        class="text-sm font-semibold text-tide underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
      >
        {#if resending}
          Sending...
        {:else if secondsLeft > 0}
          Resend code in {secondsLeft}s
        {:else}
          Resend code
        {/if}
      </button>

      {#if resendMessage}
        <p role="status" class="text-sm text-gray-600">
          {resendMessage}
        </p>
      {/if}
    </div>

  </form>

  {#snippet footer()}
    <a
      href="/login"
      class="font-semibold text-tide hover:underline"
    >
      Back to login
    </a>
  {/snippet}
</AuthShell>
