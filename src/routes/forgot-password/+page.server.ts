
import { fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import { sql } from 'drizzle-orm';
import { createHmac } from 'node:crypto';
import type { Actions } from './$types';

const confirmationMessage =
  'If an account exists with this email, you will receive a reset code.';

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase() ?? '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, {
        email,
        error: 'Please enter a valid email address.'
      });
    }

    try {
      if (!env.BETTER_AUTH_SECRET) {
        throw new Error('Authentication secret is missing');
      }

      // Hash the email so it is not stored in plain text.
      const emailHash = createHmac('sha256', env.BETTER_AUTH_SECRET)
        .update(email)
        .digest('hex');

      // Atomically allow one request every 60 seconds.
      const result = await db.execute(sql`
        INSERT INTO password_reset_cooldown
          (email_hash, last_requested_at)
        VALUES
          (${emailHash}, NOW())
        ON CONFLICT (email_hash)
        DO UPDATE SET
          last_requested_at = NOW()
        WHERE password_reset_cooldown.last_requested_at
          <= NOW() - INTERVAL '60 seconds'
        RETURNING email_hash
      `);

      // A blocked request must not generate another OTP.
      if (result.length > 0) {
        await auth.api.requestPasswordResetEmailOTP({
          body: { email }
        });
      }
    } catch (error) {
      console.error('Password reset request failed:', error);
    }

    // Same response for known and unknown accounts.
    return {
      email,
      message: confirmationMessage
    };
  }
};
