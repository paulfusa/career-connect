
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions } from './$types';
import { validatePasswordReset } from '$lib/server/password-reset-validation';

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();

    const email = data.get('email')?.toString().trim().toLowerCase() ?? '';
    const otp = data.get('otp')?.toString().trim() ?? '';
    const password = data.get('password')?.toString() ?? '';
    const confirmPassword = data.get('confirmPassword')?.toString() ?? '';

    const values = { email };

    const validationError = validatePasswordReset(
      email,
      otp,
      password,
      confirmPassword
    );

    if (validationError) {
      return fail(400, {
        ...values,
        error: validationError
      });
    }

    try {
      await auth.api.resetPasswordEmailOTP({
        body: {
          email,
          otp,
          password
        }
      });
    } catch (error) {
      console.error('Password reset failed:', error);

      return fail(400, {
        ...values,
        error: 'Invalid or expired reset code. Please request a new code if needed.'
      });
    }

    redirect(303, '/login?passwordReset=1');
  }
};
