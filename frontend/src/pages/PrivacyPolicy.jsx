import { Link } from "react-router-dom";
import { useLanguage } from "../lib/i18n";

const LAST_UPDATED = "June 6, 2026";

const sections = [
{ id: "intro", en: "1. Introduction" },
{ id: "data-collected", en: "2. Data We Collect" },
{ id: "how-we-use", en: "3. How We Use Your Data" },
{ id: "legal-basis", en: "4. Legal Basis (GDPR)" },
{ id: "sharing", en: "5. Data Sharing & Processors" },
{ id: "retention", en: "6. Data Retention" },
{ id: "your-rights", en: "7. Your Rights" },
{ id: "security", en: "8. Security" },
{ id: "international", en: "9. International Transfers" },
{ id: "children", en: "10. Children's Privacy" },
{ id: "cookies", en: "11. Cookies" },
{ id: "changes", en: "12. Changes to This Policy" },
{ id: "contact", en: "13. Contact & Data Requests" }];

const sectionsVi = [
{ id: "intro", en: "1. Giới thiệu" },
{ id: "data-collected", en: "2. Dữ liệu chúng tôi thu thập" },
{ id: "how-we-use", en: "3. Cách chúng tôi sử dụng dữ liệu" },
{ id: "legal-basis", en: "4. Cơ sở pháp lý (GDPR)" },
{ id: "sharing", en: "5. Chia sẻ dữ liệu & bên xử lý" },
{ id: "retention", en: "6. Lưu giữ dữ liệu" },
{ id: "your-rights", en: "7. Quyền của bạn" },
{ id: "security", en: "8. Bảo mật" },
{ id: "international", en: "9. Chuyển dữ liệu quốc tế" },
{ id: "children", en: "10. Quyền riêng tư trẻ em" },
{ id: "cookies", en: "11. Cookies" },
{ id: "changes", en: "12. Thay đổi chính sách" },
{ id: "contact", en: "13. Liên hệ & yêu cầu dữ liệu" }];


const dataTable = {
  en: [
  { category: "Identity", data: "Email address, full name, username" },
  { category: "Authentication", data: "Hashed password, Google OAuth token, GitHub OAuth token" },
  { category: "Uploaded Content", data: "Source code (ZIP files)" },
  { category: "Test Artifacts", data: "Test execution logs, test reports, screenshots, video recordings" },
  { category: "Technical", data: "IP address, browser type & version, device information, session data" },
  { category: "Behavioral", data: "Page views, feature usage, events (via Google Analytics, PostHog, Mixpanel)" },
  { category: "Cookies", data: "Session cookies, preference cookies, analytics cookies" },
  { category: "Financial", data: "Bank transfer reference details (QR payment confirmations)" }]











};

const processors = {
  en: [
  { name: "Supabase", role: "Database, user authentication, session management", data: "Account data, session tokens" },
  { name: "Cloudflare R2", role: "Object storage for uploaded files and test artifacts", data: "Source code, screenshots, videos, reports" },
  { name: "GitHub", role: "OAuth authentication, repository access", data: "OAuth tokens, repo/branch metadata" },
  { name: "Google", role: "OAuth authentication, analytics", data: "OAuth tokens, usage analytics" },
  { name: "PostHog", role: "Product analytics and session recording", data: "Feature usage events, session data" },
  { name: "Mixpanel", role: "Event tracking and user behavior analytics", data: "Behavioral event data" },
  { name: "Payment processor (QR)", role: "Bank transfer confirmation processing", data: "Transfer reference ID, amount" }]










};

const retentionTable = {
  en: [
  { type: "Uploaded source code", period: "30 days after test completion", reason: "Temporary processing; user can re-upload" },
  { type: "Test execution logs", period: "30 days", reason: "Available for debugging; then deleted" },
  { type: "Test reports & results", period: "30 days", reason: "User download window; then deleted" },
  { type: "Screenshots & video recordings", period: "30 days", reason: "User download window; then deleted" },
  { type: "Account data", period: "Duration of account + 90 days post-deletion", reason: "Service continuity; short grace period" },
  { type: "Analytics data", period: "Governed by PostHog/Mixpanel/Google policies", reason: "Third-party retention" },
  { type: "Payment records", period: "7 years", reason: "Financial regulatory compliance" }]










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

By using the Service, you acknowledge that you have read and understood this Privacy Policy.`
      },
      "data-collected": {
        heading: "2. Data We Collect",
        body: `We collect the following categories of personal data:`
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

• Legal Compliance: Retain records as required by applicable law and respond to lawful requests.`
      },
      "legal-basis": {
        heading: "4. Legal Basis for Processing (GDPR Article 6)",
        body: `For users in the EU/EEA, our legal basis for processing personal data is:

• Contract Performance (Art. 6(1)(b)): Processing your account data, uploaded content, and test artifacts to deliver the Service you signed up for.

• Legitimate Interests (Art. 6(1)(f)): Security monitoring, fraud prevention, and aggregate analytics to improve the platform.

• Consent (Art. 6(1)(a)): Analytics cookies (Google Analytics, PostHog, Mixpanel) — you can withdraw consent via cookie settings at any time.

• Legal Obligation (Art. 6(1)(c)): Retaining payment records for 7 years as required by financial regulations.`
      },
      sharing: {
        heading: "5. Data Sharing & Third-Party Processors",
        body: `We do not sell your personal data. We share data only with trusted processors who help us deliver the Service:`
      },
      retention: {
        heading: "6. Data Retention",
        body: `We retain your data only as long as necessary for the purposes described in this Policy. You are responsible for downloading test reports and artifacts before the 30-day window expires.`
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

To exercise any of these rights, email legal@automate.io. We will respond within 30 days. We may need to verify your identity before processing your request.`
      },
      security: {
        heading: "8. Security",
        body: `We implement industry-standard security measures to protect your data, including:

• Encryption in transit: All data transmitted between your browser and our servers uses TLS/HTTPS.
• Encryption at rest: Data stored in Supabase and Cloudflare R2 is encrypted at rest.
• Access controls: Role-based access ensures only authorized personnel can access user data.
• Audit logging: Authentication events and data access are logged for security monitoring.
• Automatic deletion: Uploaded source code and test artifacts are automatically deleted after 30 days.

Despite these measures, no method of transmission over the internet is 100% secure. If you believe your account has been compromised, contact legal@automate.io immediately.`
      },
      international: {
        heading: "9. International Data Transfers",
        body: `Automate serves users globally. Your data may be transferred to and processed in countries other than your country of residence, including the United States, where our third-party processors (Supabase, Cloudflare, Google) operate.

For transfers from the EU/EEA to third countries, we rely on:
• Standard Contractual Clauses (SCCs) approved by the European Commission
• Adequacy decisions where applicable
• Processor-level data protection agreements with all third-party sub-processors

By using the Service, you acknowledge that your data may be transferred internationally in accordance with these safeguards.`
      },
      children: {
        heading: "10. Children's Privacy",
        body: `The Service is not directed to individuals under the age of 16. We do not knowingly collect personal data from children under 16. If you believe we have inadvertently collected such data, please contact legal@automate.io and we will delete it promptly.`
      },
      cookies: {
        heading: "11. Cookies",
        body: `We use cookies and similar tracking technologies on the Service. For detailed information about the cookies we use, how to manage your preferences, and how to opt out of analytics cookies, please see our Cookie Policy.`
      },
      changes: {
        heading: "12. Changes to This Policy",
        body: `We may update this Privacy Policy from time to time. When we make material changes, we will:

• Email you at your registered address at least 14 days before changes take effect
• Display a notice on the platform

The "Last updated" date at the top reflects the most recent revision. Continued use of the Service after changes constitutes acceptance of the updated Policy.`
      },
      contact: {
        heading: "13. Contact & Data Requests",
        body: `For privacy-related inquiries, to exercise your rights, or to submit a data deletion request:

Automate Data Protection
Email: legal@automate.io
[PLACEHOLDER: Company address]

Response time: 30 days
For urgent security incidents: respond immediately via the same email.

If you are an EU resident and believe we have not adequately addressed your request, you have the right to lodge a complaint with your local supervisory authority.`
      }
    }
  }
,
  vi: {
    title: "Chính sách quyền riêng tư",
    subtitle: "Automate cam kết bảo vệ dữ liệu cá nhân của bạn và minh bạch về cách chúng tôi sử dụng dữ liệu đó.",
    sections: {
      intro: { heading: "1. Giới thiệu", body: `Chính sách quyền riêng tư này mô tả cách Automate ("chúng tôi") thu thập, sử dụng và chia sẻ thông tin về bạn khi bạn dùng nền tảng kiểm thử tự động tại automate.io.

Automate đóng vai trò Bên kiểm soát dữ liệu đối với dữ liệu cá nhân được xử lý qua nền tảng. Chúng tôi cam kết xử lý dữ liệu theo luật quyền riêng tư hiện hành, bao gồm GDPR và các nguyên tắc quyền riêng tư được công nhận quốc tế.

Bằng việc sử dụng Dịch vụ, bạn xác nhận đã đọc và hiểu Chính sách quyền riêng tư này.` },
      "data-collected": { heading: "2. Dữ liệu chúng tôi thu thập", body: "Chúng tôi thu thập các nhóm dữ liệu cá nhân sau:" },
      "how-we-use": { heading: "3. Cách chúng tôi sử dụng dữ liệu", body: `Chúng tôi sử dụng dữ liệu của bạn cho các mục đích sau:

• Quản lý tài khoản: Tạo, quản lý tài khoản, xác thực danh tính và liên hệ với bạn về Dịch vụ.

• Cung cấp dịch vụ: Xử lý source code upload, thực thi test, tạo báo cáo, chụp screenshot/video và trả kết quả.

• Tích hợp GitHub/Google: Truy cập metadata repository và xác thực OAuth để bật kiểm thử repository đã kết nối.

• Phân tích & cải tiến sản phẩm: Hiểu cách Dịch vụ được sử dụng để cải thiện tính năng, sửa lỗi và tối ưu hiệu năng.

• Thanh toán: Xử lý thanh toán chuyển khoản QR, kích hoạt credits hoặc subscription và lưu hồ sơ thanh toán.

• Bảo mật & chống gian lận: Giám sát truy cập trái phép, lạm dụng và vi phạm chính sách.

• Tuân thủ pháp lý: Lưu giữ hồ sơ theo luật hiện hành và phản hồi yêu cầu hợp pháp.` },
      "legal-basis": { heading: "4. Cơ sở pháp lý cho việc xử lý", body: `Đối với người dùng tại EU/EEA, cơ sở pháp lý để xử lý dữ liệu gồm:

• Thực hiện hợp đồng: Xử lý dữ liệu tài khoản, nội dung upload và artifact test để cung cấp Dịch vụ.

• Lợi ích hợp pháp: Giám sát bảo mật, chống gian lận và phân tích tổng hợp để cải thiện nền tảng.

• Đồng ý: Cookies phân tích; bạn có thể rút lại đồng ý trong phần cài đặt cookie.

• Nghĩa vụ pháp lý: Lưu hồ sơ thanh toán trong 7 năm theo quy định tài chính.` },
      sharing: { heading: "5. Chia sẻ dữ liệu & bên xử lý thứ ba", body: "Chúng tôi không bán dữ liệu cá nhân. Dữ liệu chỉ được chia sẻ với các bên xử lý đáng tin cậy giúp cung cấp Dịch vụ:" },
      retention: { heading: "6. Lưu giữ dữ liệu", body: "Chúng tôi chỉ lưu dữ liệu trong thời gian cần thiết cho các mục đích nêu trong Chính sách này. Bạn chịu trách nhiệm tải báo cáo và artifacts trước khi hết thời hạn 30 ngày." },
      "your-rights": { heading: "7. Quyền của bạn", body: `Tuỳ nơi cư trú, bạn có thể có các quyền sau đối với dữ liệu cá nhân:

• Quyền truy cập: Yêu cầu bản sao dữ liệu cá nhân chúng tôi đang lưu.
• Quyền chỉnh sửa: Yêu cầu sửa dữ liệu không chính xác hoặc chưa đầy đủ.
• Quyền xoá dữ liệu: Yêu cầu xoá dữ liệu cá nhân, tuỳ thuộc yêu cầu lưu giữ pháp lý.
• Quyền hạn chế xử lý: Yêu cầu hạn chế xử lý trong một số trường hợp.
• Quyền di chuyển dữ liệu: Nhận dữ liệu ở định dạng có cấu trúc, máy đọc được.
• Quyền phản đối: Phản đối xử lý dựa trên lợi ích hợp pháp.
• Quyền rút lại đồng ý: Rút lại đồng ý với cookies phân tích bất cứ lúc nào.

Để thực hiện quyền, gửi email tới legal@automate.io. Chúng tôi sẽ phản hồi trong 30 ngày và có thể cần xác minh danh tính.` },
      security: { heading: "8. Bảo mật", body: `Chúng tôi áp dụng biện pháp bảo mật tiêu chuẩn ngành, bao gồm:

• Mã hoá khi truyền: Dữ liệu giữa trình duyệt và server dùng TLS/HTTPS.
• Mã hoá khi lưu: Dữ liệu trong Supabase và Cloudflare R2 được mã hoá khi lưu.
• Kiểm soát truy cập: Phân quyền theo vai trò để giới hạn truy cập dữ liệu.
• Audit logging: Sự kiện xác thực và truy cập dữ liệu được ghi log.
• Xoá tự động: Source code và artifacts test được xoá tự động sau 30 ngày.

Không phương thức truyền dữ liệu nào an toàn tuyệt đối. Nếu bạn nghi ngờ tài khoản bị xâm phạm, hãy liên hệ legal@automate.io ngay.` },
      international: { heading: "9. Chuyển dữ liệu quốc tế", body: `Automate phục vụ người dùng toàn cầu. Dữ liệu của bạn có thể được chuyển và xử lý tại quốc gia khác nơi bạn cư trú, bao gồm Hoa Kỳ, nơi các bên xử lý thứ ba vận hành.

Đối với chuyển dữ liệu từ EU/EEA sang nước thứ ba, chúng tôi dựa trên SCCs, quyết định adequacy khi áp dụng và thoả thuận bảo vệ dữ liệu với các bên xử lý.` },
      children: { heading: "10. Quyền riêng tư trẻ em", body: "Dịch vụ không hướng tới người dưới 16 tuổi. Chúng tôi không cố ý thu thập dữ liệu cá nhân của trẻ dưới 16 tuổi. Nếu bạn cho rằng chúng tôi đã thu thập nhầm, hãy liên hệ legal@automate.io để chúng tôi xoá kịp thời." },
      cookies: { heading: "11. Cookies", body: "Chúng tôi sử dụng cookies và công nghệ theo dõi tương tự trên Dịch vụ. Xem Cookie Policy để biết chi tiết về cookies, cách quản lý tuỳ chọn và opt out khỏi analytics cookies." },
      changes: { heading: "12. Thay đổi Chính sách", body: `Chúng tôi có thể cập nhật Chính sách quyền riêng tư theo thời gian. Khi có thay đổi quan trọng, chúng tôi sẽ:

• Email tới địa chỉ đăng ký của bạn ít nhất 14 ngày trước khi thay đổi có hiệu lực
• Hiển thị thông báo trên nền tảng

Ngày "Cập nhật lần cuối" thể hiện bản sửa đổi mới nhất. Tiếp tục sử dụng Dịch vụ sau thay đổi đồng nghĩa bạn chấp nhận Chính sách đã cập nhật.` },
      contact: { heading: "13. Liên hệ & yêu cầu dữ liệu", body: `Với câu hỏi về quyền riêng tư, thực hiện quyền hoặc yêu cầu xoá dữ liệu:

Automate Data Protection
Email: legal@automate.io
[PLACEHOLDER: Company address]

Thời gian phản hồi: 30 ngày
Sự cố bảo mật khẩn cấp: phản hồi ngay qua cùng email.

Nếu bạn là cư dân EU và cho rằng yêu cầu chưa được xử lý thoả đáng, bạn có quyền khiếu nại tới cơ quan giám sát địa phương.` }
    }
  }




















































































































};

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) =>
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {h}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) =>
          <tr key={i} className="hover:bg-slate-50">
              {row.map((cell, j) =>
            <td key={j} className={`px-4 py-3 text-slate-600 ${j === 0 ? "font-medium text-slate-800" : ""}`}>
                  {cell}
                </td>
            )}
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}

export default function PrivacyPolicy() {
  const { language, setLanguage } = useLanguage();
  const vi = language === "vi";
  const t = vi ? content.vi : content.en;
  const activeSections = vi ? sectionsVi : sections;
  const dataRows = vi ? [
    { category: "Danh tính", data: "Email, họ tên, username" },
    { category: "Xác thực", data: "Mật khẩu đã hash, Google OAuth token, GitHub OAuth token" },
    { category: "Nội dung upload", data: "Source code (file ZIP)" },
    { category: "Artifacts test", data: "Log thực thi, báo cáo, screenshots, video recordings" },
    { category: "Kỹ thuật", data: "IP, loại/phiên bản trình duyệt, thông tin thiết bị, session data" },
    { category: "Hành vi", data: "Page views, sử dụng tính năng, events" },
    { category: "Cookies", data: "Session cookies, preference cookies, analytics cookies" },
    { category: "Tài chính", data: "Thông tin tham chiếu chuyển khoản QR" },
  ] : dataTable.en;
  const processorRows = vi ? [
    { name: "Supabase", role: "Database, xác thực người dùng, quản lý session", data: "Dữ liệu tài khoản, session tokens" },
    { name: "Cloudflare R2", role: "Object storage cho file upload và artifacts test", data: "Source code, screenshots, videos, reports" },
    { name: "GitHub", role: "OAuth authentication, truy cập repository", data: "OAuth tokens, metadata repo/branch" },
    { name: "Google", role: "OAuth authentication, analytics", data: "OAuth tokens, usage analytics" },
    { name: "PostHog", role: "Product analytics và session recording", data: "Sự kiện sử dụng tính năng, session data" },
    { name: "Mixpanel", role: "Event tracking và phân tích hành vi", data: "Dữ liệu event hành vi" },
    { name: "Payment processor (QR)", role: "Xử lý xác nhận chuyển khoản", data: "Transfer reference ID, số tiền" },
  ] : processors.en;
  const retentionRows = vi ? [
    { type: "Source code upload", period: "30 ngày sau khi test hoàn tất", reason: "Xử lý tạm thời; người dùng có thể upload lại" },
    { type: "Log thực thi test", period: "30 ngày", reason: "Dùng để debug, sau đó xoá" },
    { type: "Báo cáo & kết quả test", period: "30 ngày", reason: "Khoảng thời gian tải xuống, sau đó xoá" },
    { type: "Screenshots & video", period: "30 ngày", reason: "Khoảng thời gian tải xuống, sau đó xoá" },
    { type: "Dữ liệu tài khoản", period: "Trong thời gian tài khoản hoạt động + 90 ngày sau xoá", reason: "Duy trì dịch vụ và grace period ngắn" },
    { type: "Dữ liệu analytics", period: "Theo chính sách bên thứ ba", reason: "Lưu giữ bởi bên thứ ba" },
    { type: "Hồ sơ thanh toán", period: "7 năm", reason: "Tuân thủ quy định tài chính" },
  ] : retentionTable.en;

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-slate-900 hover:opacity-80">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">{vi ? "Quay lại Automate" : "Back to Automate"}</span>
          </Link>
          <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5">
            {["en", "vi"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  language === lang ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:flex lg:gap-16">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{vi ? "Mục lục" : "Contents"}</p>
            <nav className="space-y-1">
              {activeSections.map((s) =>
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-md px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600">

                  {s.en}
                </a>
              )}
            </nav>
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-400">{vi ? "Cập nhật lần cuối" : "Last updated"}</p>
              <p className="text-sm font-medium text-slate-700">{LAST_UPDATED}</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-600">
                {vi ? "Pháp lý" : "Legal"}
              </span>
              <span className="text-sm text-slate-400">{vi ? "Cập nhật" : "Updated"} {LAST_UPDATED}</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {t.title}
            </h1>
            <p className="mt-3 text-lg text-slate-500">{t.subtitle}</p>
          </div>

          <div className="space-y-12">
            {activeSections.map((s) => {
              const sec = t.sections[s.id];
              return (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="mb-4 text-xl font-semibold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {sec.heading}
                  </h2>

                  {sec.body &&
                  <div className="mb-4">
                      {sec.body.split("\n\n").map((para, i) =>
                    <p key={i} className="mb-4 leading-7 text-slate-600 whitespace-pre-line">
                          {para}
                        </p>
                    )}
                    </div>
                  }

                  {s.id === "data-collected" &&
                  <Table
                    headers={vi ? ["Nhóm", "Dữ liệu"] : ["Category", "Data Points"]}
                    rows={dataRows.map((r) => [r.category, r.data])} />

                  }

                  {s.id === "sharing" &&
                  <Table
                    headers={vi ? ["Bên xử lý", "Vai trò", "Dữ liệu chia sẻ"] : ["Processor", "Role", "Data Shared"]}
                    rows={processorRows.map((r) => [r.name, r.role, r.data])} />

                  }

                  {s.id === "retention" &&
                  <Table
                    headers={vi ? ["Loại dữ liệu", "Thời gian lưu", "Lý do"] : ["Data Type", "Retention Period", "Reason"]}
                    rows={retentionRows.map((r) => [r.type, r.period, r.reason])} />

                  }

                  <hr className="mt-10 border-slate-100" />
                </section>);

            })}
          </div>

          <div className="mt-16 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="w-full text-sm font-medium text-slate-700">{vi ? "Tài liệu pháp lý liên quan:" : "Related legal documents:"}</p>
            <Link to="/terms-of-service" className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">
              {vi ? "Điều khoản dịch vụ" : "Terms of Service"}
            </Link>
            <Link to="/cookie-policy" className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">
              {vi ? "Chính sách Cookie" : "Cookie Policy"}
            </Link>
          </div>
        </main>
      </div>
    </div>);

}
