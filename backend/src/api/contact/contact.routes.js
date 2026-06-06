const express = require('express');
const { RESEND_API_KEY, RESEND_FROM_EMAIL } = require('../../config/env');
const supabase = require('../../lib/supabase');

const router = express.Router();

const ADMIN_EMAIL = process.env.CONTACT_ADMIN_EMAIL || RESEND_FROM_EMAIL || 'admin@testpilot.cloud';

const SUBJECT_MAP = {
  consulting: 'Tư vấn',
  complaint: 'Khiếu nại',
  feedback: 'Góp ý',
  other: 'Khác',
};

function contactEmailHtml({ name, email, phone, subject, message }) {
  const subjectLabel = SUBJECT_MAP[subject] || subject;
  return `<!DOCTYPE html>
<html lang="vi">
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <tr><td align="center" style="padding-bottom:24px;">
        <span style="font-size:26px;font-weight:bold;color:#f97316;letter-spacing:-0.5px;">TestPilot</span>
      </td></tr>
      <tr><td>
        <h2 style="color:#111827;margin:0 0 4px;font-size:20px;">
          [Contact Form - ${subjectLabel}] Thư liên hệ từ ${name}
        </h2>
        <p style="color:#9ca3af;font-size:13px;margin:0 0 24px;">
          Nhận lúc: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
        </p>
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:20px;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px;vertical-align:top;">
              <strong>Họ và tên:</strong>
            </td>
            <td style="padding:6px 0;color:#111827;font-size:14px;">${name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;vertical-align:top;">
              <strong>Email:</strong>
            </td>
            <td style="padding:6px 0;font-size:14px;">
              <a href="mailto:${email}" style="color:#f97316;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;vertical-align:top;">
              <strong>Số điện thoại:</strong>
            </td>
            <td style="padding:6px 0;color:#111827;font-size:14px;">${phone || 'Không cung cấp'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:14px;vertical-align:top;">
              <strong>Mục đích:</strong>
            </td>
            <td style="padding:6px 0;">
              <span style="display:inline-block;background:#fff7ed;color:#f97316;padding:2px 10px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid #fed7aa;">
                ${subjectLabel}
              </span>
            </td>
          </tr>
        </table>
        <p style="color:#374151;font-size:14px;font-weight:600;margin:0 0 8px;">Nội dung tin nhắn:</p>
        <div style="background:#f9fafb;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:16px;color:#374151;font-size:14px;line-height:1.7;white-space:pre-wrap;">
${message}
        </div>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;">
        <p style="color:#d1d5db;font-size:12px;text-align:center;margin:0;">
          Email này được gửi tự động từ form liên hệ trên TestPilot.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các trường bắt buộc.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Địa chỉ email không hợp lệ.' });
  }

  try {
    const { error: dbError } = await supabase.from('report_contact').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread',
    });

    if (dbError) {
      console.error('[Contact] Supabase insert error:', dbError);
    }

    if (RESEND_API_KEY) {
      const subjectLabel = SUBJECT_MAP[subject] || subject;
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: [ADMIN_EMAIL],
          subject: `[Contact Form - ${subjectLabel}] Thư liên hệ từ ${name.trim()}`,
          html: contactEmailHtml({ name: name.trim(), email: email.trim(), phone: phone?.trim(), subject, message: message.trim() }),
        }),
      });

      if (!emailRes.ok) {
        const errData = await emailRes.json().catch(() => ({}));
        console.error('[Contact] Resend error:', errData);
      } else {
        console.log(`[Contact] Email sent to admin → ${ADMIN_EMAIL}`);
      }
    } else {
      console.warn('[Contact] RESEND_API_KEY not set — email skipped');
    }

    return res.status(200).json({ success: true, message: 'Liên hệ đã được gửi thành công.' });
  } catch (err) {
    console.error('[Contact] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
  }
});

module.exports = router;
