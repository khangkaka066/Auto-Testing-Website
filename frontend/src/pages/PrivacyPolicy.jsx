import { useState } from "react";
import { Link } from "react-router-dom";

const LAST_UPDATED = "June 6, 2026";

const sections = [
  { id: "intro", en: "1. Introduction", vi: "1. Giới thiệu" },
  { id: "data-collected", en: "2. Data We Collect", vi: "2. Dữ liệu chúng tôi thu thập" },
  { id: "how-we-use", en: "3. How We Use Your Data", vi: "3. Cách chúng tôi sử dụng dữ liệu" },
  { id: "legal-basis", en: "4. Legal Basis (GDPR)", vi: "4. Cơ sở pháp lý (GDPR)" },
  { id: "sharing", en: "5. Data Sharing & Processors", vi: "5. Chia sẻ dữ liệu & Bên xử lý" },
  { id: "retention", en: "6. Data Retention", vi: "6. Thời hạn lưu giữ dữ liệu" },
  { id: "your-rights", en: "7. Your Rights", vi: "7. Quyền của bạn" },
  { id: "security", en: "8. Security", vi: "8. Bảo mật" },
  { id: "international", en: "9. International Transfers", vi: "9. Chuyển dữ liệu quốc tế" },
  { id: "children", en: "10. Children's Privacy", vi: "10. Quyền riêng tư trẻ em" },
  { id: "cookies", en: "11. Cookies", vi: "11. Cookie" },
  { id: "changes", en: "12. Changes to This Policy", vi: "12. Thay đổi chính sách" },
  { id: "contact", en: "13. Contact & Data Requests", vi: "13. Liên hệ & Yêu cầu dữ liệu" },
];

const dataTable = {
  en: [
    { category: "Identity", data: "Email address, full name, username" },
    { category: "Authentication", data: "Hashed password, Google OAuth token, GitHub OAuth token" },
    { category: "Uploaded Content", data: "Source code (ZIP files)" },
    { category: "Test Artifacts", data: "Test execution logs, test reports, screenshots, video recordings" },
    { category: "Technical", data: "IP address, browser type & version, device information, session data" },
    { category: "Behavioral", data: "Page views, feature usage, events (via Google Analytics, PostHog, Mixpanel)" },
    { category: "Cookies", data: "Session cookies, preference cookies, analytics cookies" },
    { category: "Financial", data: "Bank transfer reference details (QR payment confirmations)" },
  ],
  vi: [
    { category: "Danh tính", data: "Địa chỉ email, họ tên, tên người dùng" },
    { category: "Xác thực", data: "Mật khẩu (được mã hóa hash), token Google OAuth, token GitHub OAuth" },
    { category: "Nội dung tải lên", data: "Mã nguồn (tệp ZIP)" },
    { category: "Tệp kiểm thử", data: "Nhật ký thực thi, báo cáo kiểm thử, ảnh chụp màn hình, video ghi lại" },
    { category: "Kỹ thuật", data: "Địa chỉ IP, loại & phiên bản trình duyệt, thông tin thiết bị, dữ liệu phiên" },
    { category: "Hành vi", data: "Lượt xem trang, sử dụng tính năng, sự kiện (qua Google Analytics, PostHog, Mixpanel)" },
    { category: "Cookie", data: "Cookie phiên, cookie tùy chọn, cookie phân tích" },
    { category: "Tài chính", data: "Thông tin tham chiếu chuyển khoản ngân hàng (xác nhận thanh toán QR)" },
  ],
};

const processors = {
  en: [
    { name: "Supabase", role: "Database, user authentication, session management", data: "Account data, session tokens" },
    { name: "Cloudflare R2", role: "Object storage for uploaded files and test artifacts", data: "Source code, screenshots, videos, reports" },
    { name: "GitHub", role: "OAuth authentication, repository access", data: "OAuth tokens, repo/branch metadata" },
    { name: "Google", role: "OAuth authentication, analytics", data: "OAuth tokens, usage analytics" },
    { name: "PostHog", role: "Product analytics and session recording", data: "Feature usage events, session data" },
    { name: "Mixpanel", role: "Event tracking and user behavior analytics", data: "Behavioral event data" },
    { name: "Payment processor (QR)", role: "Bank transfer confirmation processing", data: "Transfer reference ID, amount" },
  ],
  vi: [
    { name: "Supabase", role: "Cơ sở dữ liệu, xác thực người dùng, quản lý phiên", data: "Dữ liệu tài khoản, token phiên" },
    { name: "Cloudflare R2", role: "Lưu trữ đối tượng cho tệp đã tải lên và tệp kiểm thử", data: "Mã nguồn, ảnh chụp màn hình, video, báo cáo" },
    { name: "GitHub", role: "Xác thực OAuth, truy cập kho lưu trữ", data: "Token OAuth, metadata kho lưu trữ/nhánh" },
    { name: "Google", role: "Xác thực OAuth, phân tích", data: "Token OAuth, phân tích sử dụng" },
    { name: "PostHog", role: "Phân tích sản phẩm và ghi lại phiên", data: "Sự kiện sử dụng tính năng, dữ liệu phiên" },
    { name: "Mixpanel", role: "Theo dõi sự kiện và phân tích hành vi người dùng", data: "Dữ liệu sự kiện hành vi" },
    { name: "Bộ xử lý thanh toán (QR)", role: "Xử lý xác nhận chuyển khoản ngân hàng", data: "Mã tham chiếu chuyển khoản, số tiền" },
  ],
};

const retentionTable = {
  en: [
    { type: "Uploaded source code", period: "30 days after test completion", reason: "Temporary processing; user can re-upload" },
    { type: "Test execution logs", period: "30 days", reason: "Available for debugging; then deleted" },
    { type: "Test reports & results", period: "30 days", reason: "User download window; then deleted" },
    { type: "Screenshots & video recordings", period: "30 days", reason: "User download window; then deleted" },
    { type: "Account data", period: "Duration of account + 90 days post-deletion", reason: "Service continuity; short grace period" },
    { type: "Analytics data", period: "Governed by PostHog/Mixpanel/Google policies", reason: "Third-party retention" },
    { type: "Payment records", period: "7 years", reason: "Financial regulatory compliance" },
  ],
  vi: [
    { type: "Mã nguồn đã tải lên", period: "30 ngày sau khi hoàn thành kiểm thử", reason: "Xử lý tạm thời; người dùng có thể tải lên lại" },
    { type: "Nhật ký thực thi kiểm thử", period: "30 ngày", reason: "Có sẵn để gỡ lỗi; sau đó xóa" },
    { type: "Báo cáo & kết quả kiểm thử", period: "30 ngày", reason: "Cửa sổ tải xuống cho người dùng; sau đó xóa" },
    { type: "Ảnh chụp màn hình & video ghi lại", period: "30 ngày", reason: "Cửa sổ tải xuống cho người dùng; sau đó xóa" },
    { type: "Dữ liệu tài khoản", period: "Thời gian hoạt động + 90 ngày sau khi xóa", reason: "Tính liên tục dịch vụ; thời gian ân hạn ngắn" },
    { type: "Dữ liệu phân tích", period: "Theo chính sách PostHog/Mixpanel/Google", reason: "Lưu giữ bên thứ ba" },
    { type: "Hồ sơ thanh toán", period: "7 năm", reason: "Tuân thủ quy định tài chính" },
  ],
};

const content = {
  en: {
    title: "Privacy Policy",
    subtitle: "Automate is committed to protecting your personal data and being transparent about how we use it.",
    sections: {
      intro: {
        heading: "1. Introduction",
        body: `This Privacy Policy describes how Automate ("we," "us," or "our") collects, uses, and shares information about you when you use our automated testing platform at automate.io.

Automate acts as the Data Controller for personal data processed through our platform. We are committed to processing your data in accordance with applicable privacy laws, including the EU General Data Protection Regulation (GDPR) and internationally recognized privacy principles.

By using the Service, you acknowledge that you have read and understood this Privacy Policy.`,
      },
      "data-collected": {
        heading: "2. Data We Collect",
        body: `We collect the following categories of personal data:`,
      },
      "how-we-use": {
        heading: "3. How We Use Your Data",
        body: `We use your data for the following purposes:

• Account Management: Create and manage your account, authenticate your identity, and communicate with you about the Service.

• Service Delivery: Process uploaded source code, execute tests, generate reports, capture screenshots and videos, and return results to you.

• GitHub/Google Integration: Access repository metadata and authenticate via OAuth to enable connected repository testing.

• Analytics & Product Improvement: Understand how the Service is used to improve features, fix bugs, and optimize performance. We use Google Analytics, PostHog, and Mixpanel for this purpose.

• Billing & Payments: Process QR-based bank transfer payments, activate credits or subscriptions, and maintain payment records.

• Security & Fraud Prevention: Monitor for unauthorized access, abuse, and policy violations.

• Legal Compliance: Retain records as required by applicable law and respond to lawful requests.`,
      },
      "legal-basis": {
        heading: "4. Legal Basis for Processing (GDPR Article 6)",
        body: `For users in the EU/EEA, our legal basis for processing personal data is:

• Contract Performance (Art. 6(1)(b)): Processing your account data, uploaded content, and test artifacts to deliver the Service you signed up for.

• Legitimate Interests (Art. 6(1)(f)): Security monitoring, fraud prevention, and aggregate analytics to improve the platform.

• Consent (Art. 6(1)(a)): Analytics cookies (Google Analytics, PostHog, Mixpanel) — you can withdraw consent via cookie settings at any time.

• Legal Obligation (Art. 6(1)(c)): Retaining payment records for 7 years as required by financial regulations.`,
      },
      sharing: {
        heading: "5. Data Sharing & Third-Party Processors",
        body: `We do not sell your personal data. We share data only with trusted processors who help us deliver the Service:`,
      },
      retention: {
        heading: "6. Data Retention",
        body: `We retain your data only as long as necessary for the purposes described in this Policy. You are responsible for downloading test reports and artifacts before the 30-day window expires.`,
      },
      "your-rights": {
        heading: "7. Your Rights",
        body: `Depending on your location, you may have the following rights regarding your personal data:

• Right of Access: Request a copy of the personal data we hold about you.
• Right to Rectification: Request correction of inaccurate or incomplete data.
• Right to Erasure ("Right to be Forgotten"): Request deletion of your personal data, subject to legal retention requirements.
• Right to Restriction: Request that we restrict processing of your data in certain circumstances.
• Right to Data Portability: Receive your data in a structured, machine-readable format.
• Right to Object: Object to processing based on legitimate interests.
• Right to Withdraw Consent: Withdraw consent for analytics cookies at any time without affecting prior processing.

To exercise any of these rights, email legal@automate.io. We will respond within 30 days. We may need to verify your identity before processing your request.`,
      },
      security: {
        heading: "8. Security",
        body: `We implement industry-standard security measures to protect your data, including:

• Encryption in transit: All data transmitted between your browser and our servers uses TLS/HTTPS.
• Encryption at rest: Data stored in Supabase and Cloudflare R2 is encrypted at rest.
• Access controls: Role-based access ensures only authorized personnel can access user data.
• Audit logging: Authentication events and data access are logged for security monitoring.
• Automatic deletion: Uploaded source code and test artifacts are automatically deleted after 30 days.

Despite these measures, no method of transmission over the internet is 100% secure. If you believe your account has been compromised, contact legal@automate.io immediately.`,
      },
      international: {
        heading: "9. International Data Transfers",
        body: `Automate serves users globally. Your data may be transferred to and processed in countries other than your country of residence, including the United States, where our third-party processors (Supabase, Cloudflare, Google) operate.

For transfers from the EU/EEA to third countries, we rely on:
• Standard Contractual Clauses (SCCs) approved by the European Commission
• Adequacy decisions where applicable
• Processor-level data protection agreements with all third-party sub-processors

By using the Service, you acknowledge that your data may be transferred internationally in accordance with these safeguards.`,
      },
      children: {
        heading: "10. Children's Privacy",
        body: `The Service is not directed to individuals under the age of 16. We do not knowingly collect personal data from children under 16. If you believe we have inadvertently collected such data, please contact legal@automate.io and we will delete it promptly.`,
      },
      cookies: {
        heading: "11. Cookies",
        body: `We use cookies and similar tracking technologies on the Service. For detailed information about the cookies we use, how to manage your preferences, and how to opt out of analytics cookies, please see our Cookie Policy.`,
      },
      changes: {
        heading: "12. Changes to This Policy",
        body: `We may update this Privacy Policy from time to time. When we make material changes, we will:

• Email you at your registered address at least 14 days before changes take effect
• Display a notice on the platform

The "Last updated" date at the top reflects the most recent revision. Continued use of the Service after changes constitutes acceptance of the updated Policy.`,
      },
      contact: {
        heading: "13. Contact & Data Requests",
        body: `For privacy-related inquiries, to exercise your rights, or to submit a data deletion request:

Automate Data Protection
Email: legal@automate.io
[PLACEHOLDER: Company address]

Response time: 30 days
For urgent security incidents: respond immediately via the same email.

If you are an EU resident and believe we have not adequately addressed your request, you have the right to lodge a complaint with your local supervisory authority.`,
      },
    },
  },
  vi: {
    title: "Chính sách bảo mật",
    subtitle: "Automate cam kết bảo vệ dữ liệu cá nhân của bạn và minh bạch về cách chúng tôi sử dụng dữ liệu.",
    sections: {
      intro: {
        heading: "1. Giới thiệu",
        body: `Chính sách Bảo mật này mô tả cách Automate ("chúng tôi") thu thập, sử dụng và chia sẻ thông tin về bạn khi bạn sử dụng nền tảng kiểm thử tự động của chúng tôi.

Automate hoạt động với tư cách là Bên kiểm soát dữ liệu đối với dữ liệu cá nhân được xử lý qua nền tảng của chúng tôi. Chúng tôi cam kết xử lý dữ liệu của bạn theo các luật bảo mật hiện hành, bao gồm GDPR của EU và các nguyên tắc bảo mật được quốc tế công nhận.

Bằng cách sử dụng Dịch vụ, bạn xác nhận rằng bạn đã đọc và hiểu Chính sách Bảo mật này.`,
      },
      "data-collected": {
        heading: "2. Dữ liệu chúng tôi thu thập",
        body: `Chúng tôi thu thập các loại dữ liệu cá nhân sau:`,
      },
      "how-we-use": {
        heading: "3. Cách chúng tôi sử dụng dữ liệu của bạn",
        body: `Chúng tôi sử dụng dữ liệu của bạn cho các mục đích sau:

• Quản lý tài khoản: Tạo và quản lý tài khoản, xác thực danh tính và liên lạc với bạn về Dịch vụ.

• Cung cấp dịch vụ: Xử lý mã nguồn đã tải lên, thực thi kiểm thử, tạo báo cáo, chụp ảnh màn hình và video, và trả kết quả cho bạn.

• Tích hợp GitHub/Google: Truy cập metadata kho lưu trữ và xác thực qua OAuth để kiểm thử kho lưu trữ được kết nối.

• Phân tích & Cải thiện sản phẩm: Hiểu cách Dịch vụ được sử dụng để cải thiện tính năng, sửa lỗi và tối ưu hóa hiệu suất. Chúng tôi sử dụng Google Analytics, PostHog và Mixpanel cho mục đích này.

• Thanh toán & Tín dụng: Xử lý thanh toán chuyển khoản QR, kích hoạt tín dụng hoặc đăng ký và duy trì hồ sơ thanh toán.

• Bảo mật & Phòng chống gian lận: Giám sát truy cập trái phép, lạm dụng và vi phạm chính sách.`,
      },
      "legal-basis": {
        heading: "4. Cơ sở pháp lý xử lý (Điều 6 GDPR)",
        body: `Đối với người dùng tại EU/EEA, cơ sở pháp lý của chúng tôi để xử lý dữ liệu cá nhân là:

• Thực hiện hợp đồng (Điều 6(1)(b)): Xử lý dữ liệu tài khoản, nội dung đã tải lên và tệp kiểm thử để cung cấp Dịch vụ bạn đã đăng ký.

• Lợi ích hợp pháp (Điều 6(1)(f)): Giám sát bảo mật, phòng chống gian lận và phân tích tổng hợp để cải thiện nền tảng.

• Đồng ý (Điều 6(1)(a)): Cookie phân tích (Google Analytics, PostHog, Mixpanel) — bạn có thể rút lại đồng ý qua cài đặt cookie bất cứ lúc nào.

• Nghĩa vụ pháp lý (Điều 6(1)(c)): Lưu giữ hồ sơ thanh toán 7 năm theo quy định tài chính.`,
      },
      sharing: {
        heading: "5. Chia sẻ dữ liệu & Bên xử lý bên thứ ba",
        body: `Chúng tôi không bán dữ liệu cá nhân của bạn. Chúng tôi chỉ chia sẻ dữ liệu với các bên xử lý đáng tin cậy giúp chúng tôi cung cấp Dịch vụ:`,
      },
      retention: {
        heading: "6. Thời hạn lưu giữ dữ liệu",
        body: `Chúng tôi chỉ lưu giữ dữ liệu của bạn miễn là cần thiết cho các mục đích được mô tả trong Chính sách này. Bạn chịu trách nhiệm tải xuống báo cáo kiểm thử và tệp đính kèm trước khi hết thời hạn 30 ngày.`,
      },
      "your-rights": {
        heading: "7. Quyền của bạn",
        body: `Tùy thuộc vào vị trí của bạn, bạn có thể có các quyền sau đối với dữ liệu cá nhân của mình:

• Quyền truy cập: Yêu cầu bản sao dữ liệu cá nhân chúng tôi lưu giữ về bạn.
• Quyền chỉnh sửa: Yêu cầu sửa chữa dữ liệu không chính xác hoặc không đầy đủ.
• Quyền xóa ("Quyền bị lãng quên"): Yêu cầu xóa dữ liệu cá nhân của bạn.
• Quyền hạn chế: Yêu cầu chúng tôi hạn chế xử lý dữ liệu của bạn trong một số trường hợp nhất định.
• Quyền di chuyển dữ liệu: Nhận dữ liệu của bạn ở định dạng có cấu trúc, có thể đọc được bằng máy.
• Quyền phản đối: Phản đối việc xử lý dựa trên lợi ích hợp pháp.
• Quyền rút lại đồng ý: Rút lại đồng ý đối với cookie phân tích bất cứ lúc nào.

Để thực hiện bất kỳ quyền nào trong số này, hãy gửi email đến legal@automate.io. Chúng tôi sẽ phản hồi trong vòng 30 ngày.`,
      },
      security: {
        heading: "8. Bảo mật",
        body: `Chúng tôi triển khai các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ dữ liệu của bạn, bao gồm:

• Mã hóa khi truyền: Tất cả dữ liệu truyền giữa trình duyệt và máy chủ của chúng tôi sử dụng TLS/HTTPS.
• Mã hóa khi lưu trữ: Dữ liệu trong Supabase và Cloudflare R2 được mã hóa khi lưu trữ.
• Kiểm soát truy cập: Quyền truy cập dựa trên vai trò đảm bảo chỉ nhân viên được ủy quyền mới có thể truy cập dữ liệu người dùng.
• Nhật ký kiểm toán: Sự kiện xác thực và truy cập dữ liệu được ghi lại để giám sát bảo mật.
• Xóa tự động: Mã nguồn và tệp kiểm thử đã tải lên tự động bị xóa sau 30 ngày.`,
      },
      international: {
        heading: "9. Chuyển dữ liệu quốc tế",
        body: `Automate phục vụ người dùng trên toàn cầu. Dữ liệu của bạn có thể được chuyển đến và xử lý tại các quốc gia khác ngoài quốc gia cư trú của bạn, bao gồm Hoa Kỳ, nơi các bên xử lý bên thứ ba của chúng tôi hoạt động.

Đối với việc chuyển dữ liệu từ EU/EEA sang các quốc gia thứ ba, chúng tôi dựa vào:
• Điều khoản hợp đồng tiêu chuẩn (SCC) được Ủy ban Châu Âu phê duyệt
• Quyết định mức độ đầy đủ khi áp dụng
• Thỏa thuận bảo vệ dữ liệu với tất cả các bên xử lý phụ bên thứ ba`,
      },
      children: {
        heading: "10. Quyền riêng tư trẻ em",
        body: `Dịch vụ không dành cho cá nhân dưới 16 tuổi. Chúng tôi không cố tình thu thập dữ liệu cá nhân từ trẻ em dưới 16 tuổi. Nếu bạn tin rằng chúng tôi đã vô tình thu thập dữ liệu như vậy, vui lòng liên hệ legal@automate.io.`,
      },
      cookies: {
        heading: "11. Cookie",
        body: `Chúng tôi sử dụng cookie và các công nghệ theo dõi tương tự trên Dịch vụ. Để biết thông tin chi tiết về các cookie chúng tôi sử dụng và cách quản lý tùy chọn của bạn, vui lòng xem Chính sách Cookie của chúng tôi.`,
      },
      changes: {
        heading: "12. Thay đổi chính sách này",
        body: `Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian. Khi thực hiện thay đổi đáng kể, chúng tôi sẽ:

• Gửi email đến địa chỉ đã đăng ký của bạn ít nhất 14 ngày trước khi thay đổi có hiệu lực
• Hiển thị thông báo trên nền tảng

Ngày "Cập nhật lần cuối" ở đầu trang phản ánh phiên bản sửa đổi mới nhất.`,
      },
      contact: {
        heading: "13. Liên hệ & Yêu cầu dữ liệu",
        body: `Để có câu hỏi về bảo mật, thực hiện quyền của bạn hoặc gửi yêu cầu xóa dữ liệu:

Bảo vệ dữ liệu Automate
Email: legal@automate.io
[PLACEHOLDER: Địa chỉ công ty]

Thời gian phản hồi: 30 ngày

Nếu bạn là cư dân EU và cho rằng chúng tôi chưa giải quyết đầy đủ yêu cầu của bạn, bạn có quyền khiếu nại lên cơ quan giám sát địa phương của mình.`,
      },
    },
  },
};

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 text-slate-600 ${j === 0 ? "font-medium text-slate-800" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPolicy() {
  const [lang, setLang] = useState("en");
  const t = content[lang];
  const dataRows = dataTable[lang];
  const processorRows = processors[lang];
  const retentionRows = retentionTable[lang];

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-slate-900 hover:opacity-80">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Automate</span>
          </Link>
          <div className="flex items-center gap-1 rounded-full border border-slate-200 p-1">
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                lang === "en" ? "bg-orange-500 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("vi")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                lang === "vi" ? "bg-orange-500 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              VI
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:flex lg:gap-16">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Contents</p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block rounded-md px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                >
                  {lang === "en" ? s.en : s.vi}
                </a>
              ))}
            </nav>
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Last updated</p>
              <p className="text-sm font-medium text-slate-700">{LAST_UPDATED}</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-600">
                Legal
              </span>
              <span className="text-sm text-slate-400">Updated {LAST_UPDATED}</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {t.title}
            </h1>
            <p className="mt-3 text-lg text-slate-500">{t.subtitle}</p>
          </div>

          <div className="space-y-12">
            {sections.map((s) => {
              const sec = t.sections[s.id];
              return (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="mb-4 text-xl font-semibold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {sec.heading}
                  </h2>

                  {sec.body && (
                    <div className="mb-4">
                      {sec.body.split("\n\n").map((para, i) => (
                        <p key={i} className="mb-4 leading-7 text-slate-600 whitespace-pre-line">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}

                  {s.id === "data-collected" && (
                    <Table
                      headers={lang === "en" ? ["Category", "Data Points"] : ["Danh mục", "Dữ liệu"]}
                      rows={dataRows.map((r) => [r.category, r.data])}
                    />
                  )}

                  {s.id === "sharing" && (
                    <Table
                      headers={lang === "en" ? ["Processor", "Role", "Data Shared"] : ["Bên xử lý", "Vai trò", "Dữ liệu chia sẻ"]}
                      rows={processorRows.map((r) => [r.name, r.role, r.data])}
                    />
                  )}

                  {s.id === "retention" && (
                    <Table
                      headers={lang === "en" ? ["Data Type", "Retention Period", "Reason"] : ["Loại dữ liệu", "Thời hạn lưu giữ", "Lý do"]}
                      rows={retentionRows.map((r) => [r.type, r.period, r.reason])}
                    />
                  )}

                  <hr className="mt-10 border-slate-100" />
                </section>
              );
            })}
          </div>

          <div className="mt-16 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="w-full text-sm font-medium text-slate-700">Related legal documents:</p>
            <Link to="/terms-of-service" className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">
              Cookie Policy
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
