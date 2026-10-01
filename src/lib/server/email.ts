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
			subject: 'Verify your CareerConnect account',

			text: `Welcome to CareerConnect.

Please verify your email address using this link:
${verificationUrl}

This verification link will expire in 1 hour.

If you did not create a CareerConnect account, you can ignore this email.`,

			html: `
				<div style="
					margin: 0;
					padding: 40px 20px;
					background-color: #f8fafc;
					font-family: Arial, Helvetica, sans-serif;
					color: #1e293b;
				">
					<div style="
						max-width: 560px;
						margin: 0 auto;
						background-color: #ffffff;
						border: 1px solid #e2e8f0;
						border-radius: 14px;
						padding: 36px 32px;
					">

						<div style="
							text-align: center;
							margin-bottom: 28px;
						">
							<h1 style="
								margin: 0;
								font-size: 30px;
								font-weight: 700;
								letter-spacing: -0.5px;
							">
								<span style="color: #0f172a;">Career</span><span style="color: #0f8aa5;">Connect</span>
							</h1>
						</div>

						<h2 style="
							margin: 0 0 18px;
							font-size: 22px;
							font-weight: 700;
							text-align: center;
							color: #0f172a;
						">
							Verify your email address
						</h2>

						<p style="
							margin: 0 0 14px;
							font-size: 15px;
							line-height: 1.7;
							color: #475569;
						">
							Welcome to CareerConnect!
						</p>

						<p style="
							margin: 0 0 20px;
							font-size: 15px;
							line-height: 1.7;
							color: #475569;
						">
							Please verify your email address to activate your account
							and continue using CareerConnect.
						</p>

						<div style="
							text-align: center;
							margin: 30px 0;
						">
							<a
								href="${verificationUrl}"
								style="
									display: inline-block;
									background-color: #0f8aa5;
									color: #ffffff;
									text-decoration: none;
									font-size: 15px;
									font-weight: 600;
									padding: 13px 24px;
									border-radius: 8px;
								"
							>
								Verify email address
							</a>
						</div>

						<p style="
							margin: 0 0 14px;
							font-size: 14px;
							line-height: 1.6;
							color: #64748b;
						">
							This verification link will expire in <strong>1 hour</strong>.
						</p>

						<p style="
							margin: 0 0 14px;
							font-size: 14px;
							line-height: 1.6;
							color: #64748b;
						">
							If the button does not work, copy and paste this link into your browser:
						</p>

						<p style="
							margin: 0 0 22px;
							font-size: 13px;
							line-height: 1.6;
							word-break: break-word;
						">
							<a
								href="${verificationUrl}"
								style="
									color: #0f8aa5;
									text-decoration: underline;
								"
							>
								${verificationUrl}
							</a>
						</p>

						<hr style="
							border: none;
							border-top: 1px solid #e2e8f0;
							margin: 24px 0;
						">

						<p style="
							margin: 0;
							font-size: 13px;
							line-height: 1.6;
							color: #94a3b8;
							text-align: center;
						">
							If you did not create this CareerConnect account,
							you can safely ignore this email.
						</p>

					</div>
				</div>
			`
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('Failed to send verification email:', error);

		throw new Error('Could not send verification email');
	}
}