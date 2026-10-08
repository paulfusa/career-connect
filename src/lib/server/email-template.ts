
const navy = '#1B2638';
const teal = '#1F7A8C';
const muted = '#64748B';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return replacements[char];
  });
}

function emailLayout(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:32px 12px;background-color:#EEF2F7;font-family:Arial,Helvetica,sans-serif;color:${navy};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;margin:0 auto;">
        <tr>
          <td style="padding:20px 8px;">
            <div style="font-size:27px;font-weight:800;letter-spacing:-1px;color:${navy};">
              Career<span style="color:${teal};">Connect</span>
            </div>
            <div style="font-size:12px;color:${muted};margin-top:6px;">
              Your career journey starts here.
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#FFFFFF;border:1px solid #E0E8EF;border-radius:20px;padding:36px 30px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="text-align:center;padding:24px 12px;color:${muted};font-size:12px;line-height:20px;">
            CareerConnect<br>
            This is an automated account notification.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function verificationEmailHtml(url: string): string {
  const safeUrl = escapeHtml(url);

  return emailLayout('Verify your email', `
    <h1 style="font-size:25px;line-height:32px;margin:0 0 16px;color:${navy};">
      Verify your email address
    </h1>

    <p style="font-size:15px;line-height:25px;color:#526276;margin:0 0 28px;">
      Welcome to CareerConnect! Please verify your email address to activate your account and get started.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" bgcolor="${teal}" style="border-radius:12px;">
          <a href="${safeUrl}"
             style="display:block;padding:16px 22px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;line-height:21px;color:${muted};margin:24px 0 0;">
      If you didn't create this account, you can safely ignore this email.
    </p>

    <p style="font-size:12px;line-height:19px;color:${muted};margin:20px 0 0;overflow-wrap:anywhere;">
      Button not working? Copy this link into your browser:<br>
      <a href="${safeUrl}" style="color:${teal};">${safeUrl}</a>
    </p>
  `);
}

export function passwordResetEmailHtml(otp: string): string {
  return emailLayout('Reset your password', `
    <h1 style="font-size:25px;line-height:32px;margin:0 0 16px;color:${navy};">
      Reset your password
    </h1>

    <p style="font-size:15px;line-height:25px;color:#526276;margin:0 0 24px;">
      We received a request to reset your CareerConnect password. Enter the following code on the website.
    </p>

    <div style="background-color:#EEF7F8;border:1px solid #CBE4E8;border-radius:14px;padding:24px;text-align:center;">
      <div style="font-size:12px;letter-spacing:1px;color:${teal};font-weight:700;margin-bottom:12px;">
        YOUR VERIFICATION CODE
      </div>
      <div style="font-size:34px;font-weight:800;letter-spacing:7px;color:${navy};">
        ${escapeHtml(otp)}
      </div>
    </div>

    <p style="font-size:14px;color:${teal};font-weight:700;text-align:center;margin:20px 0;">
      This code expires in 10 minutes.
    </p>

    <p style="font-size:13px;line-height:21px;color:${muted};margin:24px 0 0;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `);
}
