
import { env } from '$env/dynamic/private';

import {
  verificationEmailHtml,
  passwordResetEmailHtml
} from '$lib/server/email-template';

type VerificationEmailOptions = {
  to: string;
  verificationUrl: string;
};

export async function sendVerificationEmail({
  to,
  verificationUrl
}: VerificationEmailOptions) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }

  if (!env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM is not set');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject: 'Verify your CareerConnect email',
      text: `Welcome to CareerConnect. Verify your email here: ${verificationUrl}`,
      html: verificationEmailHtml(verificationUrl)
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to send verification email:', error);

    throw new Error('Could not send verification email');
  }
}

export async function sendPasswordResetCode(
  to: string,
  otp: string
) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error('Email configuration is missing');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject: 'CareerConnect Password Reset Code',
      text: `Your password reset code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
      html: passwordResetEmailHtml(otp)
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to send password reset email:', error);

    throw new Error('Could not send password reset email');
  }
}
