import { Link } from "react-router-dom";
import { useLanguage } from "../lib/i18n";

const LAST_UPDATED = "June 6, 2026";

const sections = [
{ id: "acceptance", en: "1. Acceptance of Terms" },
{ id: "service", en: "2. Description of Service" },
{ id: "accounts", en: "3. Account Registration" },
{ id: "acceptable-use", en: "4. Acceptable Use Policy" },
{ id: "ip", en: "5. Intellectual Property" },
{ id: "payments", en: "6. Payments & Credits" },
{ id: "data-storage", en: "7. Data Storage & Retention" },
{ id: "third-party", en: "8. Third-Party Integrations" },
{ id: "disclaimers", en: "9. Disclaimer of Warranties" },
{ id: "liability", en: "10. Limitation of Liability" },
{ id: "termination", en: "11. Termination" },
{ id: "governing-law", en: "12. Governing Law" },
{ id: "changes", en: "13. Changes to Terms" },
{ id: "contact", en: "14. Contact" }];

const sectionsVi = [
{ id: "acceptance", en: "1. Chấp nhận điều khoản" },
{ id: "service", en: "2. Mô tả dịch vụ" },
{ id: "accounts", en: "3. Đăng ký tài khoản" },
{ id: "acceptable-use", en: "4. Chính sách sử dụng hợp lệ" },
{ id: "ip", en: "5. Sở hữu trí tuệ" },
{ id: "payments", en: "6. Thanh toán & Credits" },
{ id: "data-storage", en: "7. Lưu trữ & lưu giữ dữ liệu" },
{ id: "third-party", en: "8. Tích hợp bên thứ ba" },
{ id: "disclaimers", en: "9. Tuyên bố miễn trừ bảo đảm" },
{ id: "liability", en: "10. Giới hạn trách nhiệm" },
{ id: "termination", en: "11. Chấm dứt" },
{ id: "governing-law", en: "12. Luật điều chỉnh" },
{ id: "changes", en: "13. Thay đổi điều khoản" },
{ id: "contact", en: "14. Liên hệ" }];


const content = {
  en: {
    title: "Terms of Service",
    subtitle: "Please read these terms carefully before using Automate.",
    sections: {
      acceptance: {
        heading: "1. Acceptance of Terms",
        body: `By accessing or using the Automate platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use the Service.

These Terms apply to all visitors, users, and others who access the Service. Automate reserves the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.`
      },
      service: {
        heading: "2. Description of Service",
        body: `Automate is a web-based automated testing platform that enables software developers and QA engineers to:

• Upload source code (ZIP) or connect GitHub/Google repositories
• Generate Playwright test scripts using AI analysis
• Execute automated tests including UI, API, and functional tests
• Capture screenshots and video recordings of test runs
• View and download quality reports and test results

The Service is provided "as-is" and may be updated, modified, or discontinued at any time.`
      },
      accounts: {
        heading: "3. Account Registration",
        body: `To access the Service, you must create an account by providing accurate and complete information. You may register using:

• Email and password
• Google OAuth
• GitHub OAuth

You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify Automate immediately at legal@automate.io if you suspect unauthorized access.

You must be at least 16 years of age to use the Service. By creating an account, you represent that you meet this requirement and that all registration information you provide is truthful and accurate.`
      },
      "acceptable-use": {
        heading: "4. Acceptable Use Policy",
        body: `You agree not to use the Service to:

• Upload malicious, harmful, or illegal source code or files
• Attempt to reverse engineer, decompile, or disassemble any part of the platform
• Abuse, manipulate, or exploit the credit or subscription system
• Share account credentials or access tokens with unauthorized parties
• Conduct automated scraping or excessive API requests that degrade platform performance
• Upload code that violates any third-party intellectual property rights
• Circumvent any security, rate-limiting, or access controls

Violation of this policy may result in immediate account suspension or termination without refund.`
      },
      ip: {
        heading: "5. Intellectual Property",
        body: `User Content: You retain full ownership of all source code, test scripts, and other content you upload to the Service ("User Content"). By uploading, you grant Automate a limited, non-exclusive license to process your User Content solely for the purpose of providing the Service.

Platform: Automate retains all rights, title, and interest in and to the platform, including its AI models, test execution infrastructure, UI, and generated test frameworks. Nothing in these Terms transfers ownership of the platform to you.

Test Reports & Results: Generated test reports, logs, and result data are owned by you. Automate may retain anonymized aggregate statistics for platform improvement purposes.`
      },
      payments: {
        heading: "6. Payments & Credits",
        body: `Automate operates on a credit-based and/or subscription model.

Payment Method: Payments are processed via bank transfer using QR code. After completing a transfer, credits or subscription access will be activated within one (1) business day upon confirmation.

Credits: Purchased credits are non-refundable once consumed. Unused credits expire [PLACEHOLDER: expiry period].

Subscriptions: Subscription fees are billed on a recurring basis. You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period.

Refunds: Automate does not offer refunds for consumed credits or elapsed subscription periods except where required by applicable law.

Price Changes: Automate reserves the right to change pricing with at least 14 days' notice to registered users.`
      },
      "data-storage": {
        heading: "7. Data Storage & Retention",
        body: `Automate retains your data according to the following schedule:

• Uploaded source code (ZIP files): Deleted automatically 30 days after test completion
• Test execution logs: Retained for 30 days, then permanently deleted
• Test reports and results: Available for download for 30 days, then deleted
• Screenshots and video recordings: Retained for 30 days after test run
• Account data (email, name, username): Retained while account is active and for 90 days after account deletion
• Payment records: Retained for 7 years as required by financial regulations

You are responsible for downloading and backing up any test reports or artifacts you wish to keep before the 30-day retention period expires.`
      },
      "third-party": {
        heading: "8. Third-Party Integrations",
        body: `The Service integrates with third-party services including:

• GitHub — for repository access and OAuth authentication
• Google — for OAuth authentication and analytics
• Supabase — for database and authentication infrastructure
• Cloudflare R2 — for file storage
• PostHog & Mixpanel — for product analytics

Your use of these integrations is subject to the respective third-party terms of service. Automate is not responsible for the availability or conduct of third-party services.

When you connect GitHub or Google to your account, you authorize Automate to access only the scopes you approve during the OAuth flow. You may revoke these permissions at any time through your GitHub or Google account settings.`
      },
      disclaimers: {
        heading: "9. Disclaimer of Warranties",
        body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

Automate does not warrant that:
• The Service will be uninterrupted or error-free
• Test results generated by the Service will be accurate or complete
• The Service will meet your specific requirements

You use the Service at your own risk.`
      },
      liability: {
        heading: "10. Limitation of Liability",
        body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AUTOMATE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.

AUTOMATE'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO AUTOMATE IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) USD $100.

Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In such jurisdictions, the above limitations apply to the extent permitted by law.`
      },
      termination: {
        heading: "11. Termination",
        body: `You may terminate your account at any time by contacting legal@automate.io or using the account deletion feature in your profile settings.

Automate may suspend or terminate your account immediately, without prior notice, if you:
• Violate these Terms or the Acceptable Use Policy
• Engage in fraudulent or abusive behavior
• Fail to pay applicable fees

Upon termination:
• Your access to the Service will be revoked immediately
• Your uploaded source code, test logs, and reports will be deleted within 30 days
• Account data will be retained for 90 days before permanent deletion
• Credits and subscription fees already paid are non-refundable

Sections 5 (Intellectual Property), 9 (Disclaimers), 10 (Limitation of Liability), and 12 (Governing Law) survive termination.`
      },
      "governing-law": {
        heading: "12. Governing Law & Dispute Resolution",
        body: `These Terms are governed by internationally recognized principles of commercial law. For users in the European Union, GDPR rights and EU consumer protections apply and take precedence where applicable.

Disputes: Any disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the rules of [PLACEHOLDER: arbitration body], with proceedings conducted in English.

For EU users: Nothing in these Terms limits your rights under applicable EU law, including your right to bring claims before your local courts.`
      },
      changes: {
        heading: "13. Changes to These Terms",
        body: `Automate reserves the right to modify these Terms at any time. When we make material changes, we will:

• Send an email notification to your registered email address
• Display a notice on the platform at least 14 days before changes take effect

Your continued use of the Service after the effective date of updated Terms constitutes your acceptance of the changes. If you do not agree, you must stop using the Service and may delete your account.`
      },
      contact: {
        heading: "14. Contact",
        body: `For questions about these Terms, please contact:

Automate Legal Team
Email: legal@automate.io
[PLACEHOLDER: Company address]

We aim to respond to all inquiries within 5 business days.`
      }
    }
  }
,
  vi: {
    title: "Điều khoản dịch vụ",
    subtitle: "Vui lòng đọc kỹ các điều khoản này trước khi sử dụng Automate.",
    sections: {
      acceptance: { heading: "1. Chấp nhận điều khoản", body: `Bằng việc truy cập hoặc sử dụng nền tảng Automate ("Dịch vụ"), bạn đồng ý bị ràng buộc bởi Điều khoản dịch vụ này ("Điều khoản"). Nếu không đồng ý với toàn bộ Điều khoản, vui lòng không sử dụng Dịch vụ.

Điều khoản áp dụng cho mọi khách truy cập và người dùng Dịch vụ. Automate có quyền cập nhật Điều khoản bất cứ lúc nào. Việc tiếp tục sử dụng Dịch vụ sau thay đổi đồng nghĩa bạn chấp nhận Điều khoản đã cập nhật.` },
      service: { heading: "2. Mô tả dịch vụ", body: `Automate là nền tảng kiểm thử tự động trên web cho phép developer và QA engineer:

• Upload source code (ZIP) hoặc kết nối repository GitHub/Google
• Tạo Playwright test scripts bằng phân tích AI
• Thực thi automated tests gồm UI, API và functional tests
• Chụp screenshots và video recordings của lượt test
• Xem và tải báo cáo chất lượng cùng kết quả test

Dịch vụ được cung cấp "nguyên trạng" và có thể được cập nhật, sửa đổi hoặc ngừng cung cấp bất cứ lúc nào.` },
      accounts: { heading: "3. Đăng ký tài khoản", body: `Để truy cập Dịch vụ, bạn phải tạo tài khoản với thông tin chính xác và đầy đủ. Bạn có thể đăng ký bằng:

• Email và mật khẩu
• Google OAuth
• GitHub OAuth

Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động dưới tài khoản của mình. Nếu nghi ngờ truy cập trái phép, hãy thông báo ngay cho Automate qua legal@automate.io.

Bạn phải từ 16 tuổi trở lên để sử dụng Dịch vụ.` },
      "acceptable-use": { heading: "4. Chính sách sử dụng hợp lệ", body: `Bạn đồng ý không sử dụng Dịch vụ để:

• Upload source code hoặc file độc hại, nguy hiểm hoặc bất hợp pháp
• Reverse engineer, decompile hoặc disassemble bất kỳ phần nào của nền tảng
• Lạm dụng hoặc khai thác hệ thống credit/subscription
• Chia sẻ thông tin tài khoản hoặc access token với bên không được uỷ quyền
• Scraping tự động hoặc gọi API quá mức gây giảm hiệu năng
• Upload code vi phạm quyền sở hữu trí tuệ của bên thứ ba
• Vượt qua cơ chế bảo mật, rate limit hoặc kiểm soát truy cập

Vi phạm có thể dẫn tới đình chỉ hoặc chấm dứt tài khoản ngay lập tức mà không hoàn tiền.` },
      ip: { heading: "5. Sở hữu trí tuệ", body: `Nội dung người dùng: Bạn giữ toàn quyền sở hữu source code, test scripts và nội dung khác upload lên Dịch vụ. Khi upload, bạn cấp cho Automate giấy phép giới hạn, không độc quyền để xử lý nội dung chỉ nhằm cung cấp Dịch vụ.

Nền tảng: Automate giữ mọi quyền đối với nền tảng, bao gồm AI models, hạ tầng thực thi test, UI và test frameworks được tạo. Điều khoản này không chuyển quyền sở hữu nền tảng cho bạn.

Báo cáo & kết quả test: Báo cáo, logs và dữ liệu kết quả thuộc về bạn. Automate có thể giữ thống kê tổng hợp đã ẩn danh để cải thiện nền tảng.` },
      payments: { heading: "6. Thanh toán & Credits", body: `Automate hoạt động theo mô hình credit và/hoặc subscription.

Phương thức thanh toán: Thanh toán được xử lý qua chuyển khoản ngân hàng bằng QR code. Sau khi chuyển khoản, credits hoặc subscription sẽ được kích hoạt trong một (1) ngày làm việc sau khi xác nhận.

Credits: Credits đã mua không hoàn tiền sau khi sử dụng. Credits chưa dùng hết hạn theo thời hạn được công bố.

Subscriptions: Phí subscription được tính định kỳ. Bạn có thể huỷ bất cứ lúc nào; việc huỷ có hiệu lực vào cuối kỳ thanh toán hiện tại.

Refunds: Automate không hoàn tiền cho credits đã dùng hoặc thời gian subscription đã trôi qua, trừ khi luật yêu cầu.

Thay đổi giá: Automate có quyền thay đổi giá với thông báo trước ít nhất 14 ngày tới người dùng đã đăng ký.` },
      "data-storage": { heading: "7. Lưu trữ & lưu giữ dữ liệu", body: `Automate lưu dữ liệu theo lịch sau:

• Source code upload (ZIP): Tự động xoá sau 30 ngày kể từ khi test hoàn tất
• Log thực thi test: Lưu 30 ngày rồi xoá vĩnh viễn
• Báo cáo và kết quả test: Có thể tải xuống trong 30 ngày rồi xoá
• Screenshots và video: Lưu 30 ngày sau lượt test
• Dữ liệu tài khoản: Lưu khi tài khoản hoạt động và 90 ngày sau khi xoá
• Hồ sơ thanh toán: Lưu 7 năm theo quy định tài chính

Bạn chịu trách nhiệm tải và sao lưu báo cáo/artifacts muốn giữ trước khi hết hạn 30 ngày.` },
      "third-party": { heading: "8. Tích hợp bên thứ ba", body: `Dịch vụ tích hợp với các dịch vụ bên thứ ba gồm:

• GitHub để truy cập repository và OAuth
• Google để OAuth và analytics
• Supabase cho database và authentication
• Cloudflare R2 cho file storage
• PostHog & Mixpanel cho product analytics

Việc sử dụng các tích hợp này chịu sự điều chỉnh của điều khoản từng bên thứ ba. Automate không chịu trách nhiệm về khả dụng hoặc hành vi của dịch vụ bên thứ ba.

Khi kết nối GitHub hoặc Google, bạn uỷ quyền Automate truy cập đúng scopes bạn phê duyệt. Bạn có thể thu hồi quyền bất cứ lúc nào trong cài đặt GitHub hoặc Google.` },
      disclaimers: { heading: "9. Tuyên bố miễn trừ bảo đảm", body: `DỊCH VỤ ĐƯỢC CUNG CẤP "NGUYÊN TRẠNG" VÀ "NHƯ HIỆN CÓ", KHÔNG KÈM BẤT KỲ BẢO ĐẢM NÀO, DÙ RÕ RÀNG HAY NGỤ Ý.

Automate không bảo đảm rằng:
• Dịch vụ luôn không gián đoạn hoặc không lỗi
• Kết quả test luôn chính xác hoặc đầy đủ
• Dịch vụ đáp ứng yêu cầu cụ thể của bạn

Bạn sử dụng Dịch vụ với rủi ro của riêng mình.` },
      liability: { heading: "10. Giới hạn trách nhiệm", body: `TRONG PHẠM VI TỐI ĐA LUẬT CHO PHÉP, AUTOMATE KHÔNG CHỊU TRÁCH NHIỆM CHO THIỆT HẠI GIÁN TIẾP, NGẪU NHIÊN, ĐẶC BIỆT, HỆ QUẢ HOẶC MANG TÍNH TRỪNG PHẠT, BAO GỒM MẤT LỢI NHUẬN, DỮ LIỆU HOẶC CƠ HỘI KINH DOANH.

TỔNG TRÁCH NHIỆM CỘNG DỒN CỦA AUTOMATE ĐỐI VỚI BẠN KHÔNG VƯỢT QUÁ GIÁ TRỊ LỚN HƠN GIỮA (A) SỐ TIỀN BẠN ĐÃ TRẢ TRONG 12 THÁNG TRƯỚC KHI PHÁT SINH KHIẾU NẠI HOẶC (B) 100 USD.

Một số khu vực pháp lý không cho phép loại trừ bảo đảm hoặc giới hạn trách nhiệm nhất định; khi đó giới hạn trên áp dụng trong phạm vi luật cho phép.` },
      termination: { heading: "11. Chấm dứt", body: `Bạn có thể chấm dứt tài khoản bất cứ lúc nào bằng cách liên hệ legal@automate.io hoặc dùng tính năng xoá tài khoản trong profile.

Automate có thể đình chỉ hoặc chấm dứt tài khoản ngay lập tức nếu bạn:
• Vi phạm Điều khoản hoặc Acceptable Use Policy
• Có hành vi gian lận hoặc lạm dụng
• Không thanh toán phí áp dụng

Khi chấm dứt:
• Quyền truy cập Dịch vụ bị thu hồi ngay
• Source code, test logs và reports được xoá trong 30 ngày
• Dữ liệu tài khoản được giữ 90 ngày trước khi xoá vĩnh viễn
• Credits và phí subscription đã trả không hoàn tiền

Các mục về Sở hữu trí tuệ, Miễn trừ, Giới hạn trách nhiệm và Luật điều chỉnh vẫn có hiệu lực sau chấm dứt.` },
      "governing-law": { heading: "12. Luật điều chỉnh & giải quyết tranh chấp", body: `Điều khoản này được điều chỉnh bởi các nguyên tắc thương mại được công nhận quốc tế. Với người dùng EU, quyền GDPR và bảo vệ người tiêu dùng EU được ưu tiên khi áp dụng.

Tranh chấp trước tiên sẽ được giải quyết bằng thương lượng thiện chí. Nếu không giải quyết trong 30 ngày, tranh chấp sẽ được đưa ra trọng tài ràng buộc theo quy tắc của [PLACEHOLDER: arbitration body], thủ tục bằng tiếng Anh.

Với người dùng EU, không điều gì trong Điều khoản này giới hạn quyền theo luật EU hiện hành.` },
      changes: { heading: "13. Thay đổi Điều khoản", body: `Automate có quyền sửa đổi Điều khoản bất cứ lúc nào. Khi có thay đổi quan trọng, chúng tôi sẽ:

• Gửi email thông báo tới địa chỉ đăng ký
• Hiển thị thông báo trên nền tảng ít nhất 14 ngày trước khi thay đổi có hiệu lực

Việc tiếp tục sử dụng Dịch vụ sau ngày hiệu lực đồng nghĩa bạn chấp nhận thay đổi. Nếu không đồng ý, bạn phải ngừng sử dụng Dịch vụ và có thể xoá tài khoản.` },
      contact: { heading: "14. Liên hệ", body: `Nếu có câu hỏi về Điều khoản, vui lòng liên hệ:

Automate Legal Team
Email: legal@automate.io
[PLACEHOLDER: Company address]

Chúng tôi cố gắng phản hồi mọi yêu cầu trong 5 ngày làm việc.` },
    }
  }




























































































































































};

export default function TermsOfService() {
  const { language, setLanguage } = useLanguage();
  const vi = language === "vi";
  const t = vi ? content.vi : content.en;
  const activeSections = vi ? sectionsVi : sections;

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
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {vi ? "Mục lục" : "Contents"}
            </p>
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
            <h1
              className="text-4xl font-bold text-slate-900"
              style={{ fontFamily: "'Outfit', sans-serif" }}>

              {t.title}
            </h1>
            <p className="mt-3 text-lg text-slate-500">{t.subtitle}</p>
          </div>

          <div className="space-y-12">
            {activeSections.map((s) => {
              const sec = t.sections[s.id];
              return (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2
                    className="mb-4 text-xl font-semibold text-slate-900"
                    style={{ fontFamily: "'Outfit', sans-serif" }}>

                    {sec.heading}
                  </h2>
                  <div className="prose prose-slate max-w-none">
                    {sec.body.split("\n\n").map((para, i) =>
                    <p key={i} className="mb-4 leading-7 text-slate-600 whitespace-pre-line">
                        {para}
                      </p>
                    )}
                  </div>
                  <hr className="mt-10 border-slate-100" />
                </section>);

            })}
          </div>

          {/* Related links */}
          <div className="mt-16 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="w-full text-sm font-medium text-slate-700">{vi ? "Tài liệu pháp lý liên quan:" : "Related legal documents:"}</p>
            <Link
              to="/privacy-policy"
              className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">

              {vi ? "Chính sách quyền riêng tư" : "Privacy Policy"}
            </Link>
            <Link
              to="/cookie-policy"
              className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">

              {vi ? "Chính sách Cookie" : "Cookie Policy"}
            </Link>
          </div>
        </main>
      </div>
    </div>);

}
