const { RESEND_API_KEY, RESEND_FROM_EMAIL, BACKEND_URL, FRONTEND_URL } = require('../config/env');

async function callResend(payload) {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — email skipped');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Resend API error');
  return data;
}

const fromAddress = () => RESEND_FROM_EMAIL || 'onboarding@resend.dev';

async function sendVerificationEmail(to, name, token) {
  const link = `${BACKEND_URL || 'http://localhost:5001'}/api/auth/verify?token=${token}`;
  await callResend({
    from: fromAddress(),
    to: [to],
    subject: 'Verify your TestPilot account',
    html: verificationTemplate(name, link),
  });
  console.log(`[Email] Verification email → ${to}`);
}

async function sendWelcomeEmail(to, name) {
  const dashUrl = `${FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
  await callResend({
    from: fromAddress(),
    to: [to],
    subject: 'Welcome to TestPilot!',
    html: welcomeTemplate(name, dashUrl),
  });
  console.log(`[Email] Welcome email → ${to}`);
}

function verificationTemplate(name, link) {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr><td align="center" style="padding-bottom:28px;">
        <span style="font-size:26px;font-weight:bold;color:#f97316;letter-spacing:-0.5px;">TestPilot</span>
      </td></tr>
      <tr><td>
        <h2 style="color:#111827;margin:0 0 12px;font-size:22px;">Hi ${name}, please verify your email</h2>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 24px;">
          Thanks for signing up! Click the button below to verify your email address and activate your account.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${link}"
             style="display:inline-block;background:#f97316;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            Verify Email Address
          </a>
        </div>
        <p style="color:#9ca3af;font-size:13px;line-height:1.6;">
          This link expires in <strong>24 hours</strong>. If you didn't create a TestPilot account, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;">
        <p style="color:#d1d5db;font-size:11px;word-break:break-all;">
          Trouble clicking the button? Copy and paste this link into your browser:<br>
          <a href="${link}" style="color:#f97316;">${link}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function welcomeTemplate(name, dashUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr><td align="center" style="padding-bottom:28px;">
        <span style="font-size:26px;font-weight:bold;color:#f97316;letter-spacing:-0.5px;">TestPilot</span>
      </td></tr>
      <tr><td>
        <h2 style="color:#111827;margin:0 0 12px;font-size:22px;">Welcome aboard, ${name}! 🎉</h2>
        <p style="color:#6b7280;line-height:1.7;margin:0 0 16px;">
          Your TestPilot account is ready. You can now start automating your QA workflow with AI-powered testing.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${dashUrl}"
             style="display:inline-block;background:#f97316;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            Go to Dashboard
          </a>
        </div>
        <p style="color:#6b7280;font-size:14px;margin:0 0 8px;font-weight:600;">What you can do with TestPilot:</p>
        <ul style="color:#6b7280;font-size:14px;line-height:2;margin:0;padding-left:20px;">
          <li>Run automated tests on any website</li>
          <li>Get AI-powered test reports and insights</li>
          <li>Monitor test results in real-time</li>
          <li>Integrate with your CI/CD pipeline</li>
        </ul>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;">
        <p style="color:#d1d5db;font-size:12px;text-align:center;margin:0;">The TestPilot Team</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

module.exports = { sendVerificationEmail, sendWelcomeEmail };
