import { env } from '$env/dynamic/private';

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
			html: `
				<h2>Welcome to CareerConnect</h2>

				<p>Please verify your email address to activate your account.</p>

				<p>
					<a href="${verificationUrl}">
						Verify email address
					</a>
				</p>

				<p>
					If you did not create this account, you can ignore this email.
				</p>
			`
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('Failed to send verification email:', error);

		throw new Error('Could not send verification email');
	}
}