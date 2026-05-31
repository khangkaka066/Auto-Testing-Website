function parseDevice(ua = '', ip = '') {
  let browser = 'Unknown Browser';
  if (/Edg\//.test(ua))                           browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/.test(ua))                browser = 'Opera';
  else if (/Chrome\//.test(ua))                   browser = 'Google Chrome';
  else if (/Firefox\//.test(ua))                  browser = 'Mozilla Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

  let os = 'Unknown OS';
  if (/Windows NT 10/.test(ua))    os = 'Windows 10/11';
  else if (/Windows NT/.test(ua))  os = 'Windows';
  else if (/Mac OS X/.test(ua))    os = 'macOS';
  else if (/Android/.test(ua))     os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua))       os = 'Linux';

  return { browser, os, ip: ip || 'Unknown' };
}

const BASE = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:32px 0;min-height:100vh">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
`;
const FOOTER = `
      <div style="background:#f1f5f9;padding:20px 32px;text-align:center">
        <p style="margin:0;font-size:12px;color:#94a3b8">
          © ${new Date().getFullYear()} TestPilot · AI-Powered Automated Testing
        </p>
        <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1">
          Bạn nhận email này vì vừa đăng nhập vào tài khoản TestPilot.
        </p>
      </div>
    </div>
  </div>
`;

function welcomeEmail({ name, email }) {
  return BASE + `
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#ea580c 0%,#f97316 100%);padding:40px 32px;text-align:center">
        <div style="width:56px;height:56px;background:rgba(255,255,255,.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
          <span style="font-size:28px">🚀</span>
        </div>
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px">
          Chào mừng đến TestPilot!
        </h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px">
          Tài khoản của bạn đã sẵn sàng
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px">
        <p style="margin:0 0 16px;font-size:16px;color:#1e293b;font-weight:600">
          Xin chào ${name || 'bạn'} 👋
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7">
          Cảm ơn bạn đã đăng ký TestPilot. Bạn đã sẵn sàng để tự động hoá toàn bộ quy trình kiểm thử website bằng AI.
        </p>

        <!-- Feature list -->
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
          ${[
            ['⚡', 'AI tự sinh test case từ source code của bạn'],
            ['🧪', 'Chạy Playwright tests tự động, không cần cấu hình'],
            ['📊', 'Báo cáo chi tiết với health score và danh sách lỗi'],
            ['🔗', 'Tích hợp GitHub — clone và test trực tiếp từ repo'],
          ].map(([icon, text]) => `
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
              <span style="font-size:16px;flex-shrink:0">${icon}</span>
              <span style="font-size:13px;color:#475569;line-height:1.5">${text}</span>
            </div>
          `).join('')}
        </div>

        <!-- Credits info -->
        <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:12px;padding:16px;margin-bottom:24px;display:flex;align-items:center;gap:12px">
          <span style="font-size:20px">🎁</span>
          <div>
            <p style="margin:0;font-size:13px;font-weight:600;color:#7c3aed">500,000 credits miễn phí đã được thêm vào tài khoản của bạn</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9061f9">Đủ để chạy hàng chục test pipeline ngay hôm nay</p>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align:center">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
            style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.2px">
            Bắt đầu test ngay →
          </a>
        </div>

        <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center">
          Email đăng ký: <strong style="color:#64748b">${email}</strong>
        </p>
      </div>
  ` + FOOTER;
}

function loginNotificationEmail({ name, email, ip, ua, time }) {
  const { browser, os } = parseDevice(ua, ip);
  const timeStr = new Date(time).toLocaleString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return BASE + `
      <!-- Header -->
      <div style="background:#0f172a;padding:32px;text-align:center">
        <div style="width:48px;height:48px;background:#1e293b;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px">
          <span style="font-size:22px">🔐</span>
        </div>
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">
          Đăng nhập mới vào tài khoản
        </h1>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:13px">
          TestPilot Security Alert
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px">
        <p style="margin:0 0 20px;font-size:15px;color:#1e293b">
          Xin chào <strong>${name || 'bạn'}</strong>,
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7">
          Chúng tôi ghi nhận một lần đăng nhập mới vào tài khoản TestPilot của bạn. Dưới đây là thông tin chi tiết:
        </p>

        <!-- Device info table -->
        <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px">
          ${[
            ['🕐', 'Thời gian', timeStr],
            ['🌐', 'Trình duyệt', browser],
            ['💻', 'Hệ điều hành', os],
            ['📍', 'Địa chỉ IP', ip || 'Không xác định'],
          ].map(([icon, label, value], i) => `
            <div style="display:flex;align-items:center;padding:13px 16px;${i > 0 ? 'border-top:1px solid #f1f5f9;' : ''}background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
              <span style="font-size:15px;width:28px;flex-shrink:0">${icon}</span>
              <span style="font-size:13px;color:#94a3b8;width:120px;flex-shrink:0">${label}</span>
              <span style="font-size:13px;color:#1e293b;font-weight:500">${value}</span>
            </div>
          `).join('')}
        </div>

        <!-- Warning box -->
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="margin:0;font-size:13px;color:#9a3412;font-weight:600">⚠️ Không phải bạn đăng nhập?</p>
          <p style="margin:6px 0 0;font-size:13px;color:#c2410c;line-height:1.6">
            Nếu bạn không thực hiện đăng nhập này, hãy đổi mật khẩu ngay lập tức và liên hệ với chúng tôi.
          </p>
        </div>

        <!-- CTA -->
        <div style="text-align:center;display:flex;gap:12px;justify-content:center">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
            style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:600">
            Vào Dashboard
          </a>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile"
            style="display:inline-block;background:#f1f5f9;color:#475569;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:600">
            Đổi mật khẩu
          </a>
        </div>

        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center">
          ${email}
        </p>
      </div>
  ` + FOOTER;
}

module.exports = { welcomeEmail, loginNotificationEmail };
