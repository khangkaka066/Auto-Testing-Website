import { useState } from "react";
import { Link } from "react-router-dom";

const LAST_UPDATED = "June 6, 2026";

const sections = [
  { id: "acceptance", en: "1. Acceptance of Terms", vi: "1. Chấp nhận điều khoản" },
  { id: "service", en: "2. Description of Service", vi: "2. Mô tả dịch vụ" },
  { id: "accounts", en: "3. Account Registration", vi: "3. Đăng ký tài khoản" },
  { id: "acceptable-use", en: "4. Acceptable Use Policy", vi: "4. Chính sách sử dụng hợp lệ" },
  { id: "ip", en: "5. Intellectual Property", vi: "5. Quyền sở hữu trí tuệ" },
  { id: "payments", en: "6. Payments & Credits", vi: "6. Thanh toán & Tín dụng" },
  { id: "data-storage", en: "7. Data Storage & Retention", vi: "7. Lưu trữ & Bảo lưu dữ liệu" },
  { id: "third-party", en: "8. Third-Party Integrations", vi: "8. Tích hợp bên thứ ba" },
  { id: "disclaimers", en: "9. Disclaimer of Warranties", vi: "9. Từ chối bảo đảm" },
  { id: "liability", en: "10. Limitation of Liability", vi: "10. Giới hạn trách nhiệm" },
  { id: "termination", en: "11. Termination", vi: "11. Chấm dứt" },
  { id: "governing-law", en: "12. Governing Law", vi: "12. Luật áp dụng" },
  { id: "changes", en: "13. Changes to Terms", vi: "13. Thay đổi điều khoản" },
  { id: "contact", en: "14. Contact", vi: "14. Liên hệ" },
];

const content = {
  en: {
    title: "Terms of Service",
    subtitle: "Please read these terms carefully before using Automate.",
    sections: {
      acceptance: {
        heading: "1. Acceptance of Terms",
        body: `By accessing or using the Automate platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use the Service.

These Terms apply to all visitors, users, and others who access the Service. Automate reserves the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.`,
      },
      service: {
        heading: "2. Description of Service",
        body: `Automate is a web-based automated testing platform that enables software developers and QA engineers to:

• Upload source code (ZIP) or connect GitHub/Google repositories
• Generate Playwright test scripts using AI analysis
• Execute automated tests including UI, API, and functional tests
• Capture screenshots and video recordings of test runs
• View and download quality reports and test results

The Service is provided "as-is" and may be updated, modified, or discontinued at any time.`,
      },
      accounts: {
        heading: "3. Account Registration",
        body: `To access the Service, you must create an account by providing accurate and complete information. You may register using:

• Email and password
• Google OAuth
• GitHub OAuth

You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify Automate immediately at legal@automate.io if you suspect unauthorized access.

You must be at least 16 years of age to use the Service. By creating an account, you represent that you meet this requirement and that all registration information you provide is truthful and accurate.`,
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

Violation of this policy may result in immediate account suspension or termination without refund.`,
      },
      ip: {
        heading: "5. Intellectual Property",
        body: `User Content: You retain full ownership of all source code, test scripts, and other content you upload to the Service ("User Content"). By uploading, you grant Automate a limited, non-exclusive license to process your User Content solely for the purpose of providing the Service.

Platform: Automate retains all rights, title, and interest in and to the platform, including its AI models, test execution infrastructure, UI, and generated test frameworks. Nothing in these Terms transfers ownership of the platform to you.

Test Reports & Results: Generated test reports, logs, and result data are owned by you. Automate may retain anonymized aggregate statistics for platform improvement purposes.`,
      },
      payments: {
        heading: "6. Payments & Credits",
        body: `Automate operates on a credit-based and/or subscription model.

Payment Method: Payments are processed via bank transfer using QR code. After completing a transfer, credits or subscription access will be activated within one (1) business day upon confirmation.

Credits: Purchased credits are non-refundable once consumed. Unused credits expire [PLACEHOLDER: expiry period].

Subscriptions: Subscription fees are billed on a recurring basis. You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period.

Refunds: Automate does not offer refunds for consumed credits or elapsed subscription periods except where required by applicable law.

Price Changes: Automate reserves the right to change pricing with at least 14 days' notice to registered users.`,
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

You are responsible for downloading and backing up any test reports or artifacts you wish to keep before the 30-day retention period expires.`,
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

When you connect GitHub or Google to your account, you authorize Automate to access only the scopes you approve during the OAuth flow. You may revoke these permissions at any time through your GitHub or Google account settings.`,
      },
      disclaimers: {
        heading: "9. Disclaimer of Warranties",
        body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

Automate does not warrant that:
• The Service will be uninterrupted or error-free
• Test results generated by the Service will be accurate or complete
• The Service will meet your specific requirements

You use the Service at your own risk.`,
      },
      liability: {
        heading: "10. Limitation of Liability",
        body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AUTOMATE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.

AUTOMATE'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO AUTOMATE IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) USD $100.

Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In such jurisdictions, the above limitations apply to the extent permitted by law.`,
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

Sections 5 (Intellectual Property), 9 (Disclaimers), 10 (Limitation of Liability), and 12 (Governing Law) survive termination.`,
      },
      "governing-law": {
        heading: "12. Governing Law & Dispute Resolution",
        body: `These Terms are governed by internationally recognized principles of commercial law. For users in the European Union, GDPR rights and EU consumer protections apply and take precedence where applicable.

Disputes: Any disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the rules of [PLACEHOLDER: arbitration body], with proceedings conducted in English.

For EU users: Nothing in these Terms limits your rights under applicable EU law, including your right to bring claims before your local courts.`,
      },
      changes: {
        heading: "13. Changes to These Terms",
        body: `Automate reserves the right to modify these Terms at any time. When we make material changes, we will:

• Send an email notification to your registered email address
• Display a notice on the platform at least 14 days before changes take effect

Your continued use of the Service after the effective date of updated Terms constitutes your acceptance of the changes. If you do not agree, you must stop using the Service and may delete your account.`,
      },
      contact: {
        heading: "14. Contact",
        body: `For questions about these Terms, please contact:

Automate Legal Team
Email: legal@automate.io
[PLACEHOLDER: Company address]

We aim to respond to all inquiries within 5 business days.`,
      },
    },
  },
  vi: {
    title: "Điều khoản sử dụng",
    subtitle: "Vui lòng đọc kỹ các điều khoản này trước khi sử dụng Automate.",
    sections: {
      acceptance: {
        heading: "1. Chấp nhận điều khoản",
        body: `Bằng cách truy cập hoặc sử dụng nền tảng Automate ("Dịch vụ"), bạn đồng ý bị ràng buộc bởi các Điều khoản sử dụng này ("Điều khoản"). Nếu bạn không đồng ý với tất cả các Điều khoản này, vui lòng không sử dụng Dịch vụ.

Các Điều khoản này áp dụng cho tất cả khách truy cập, người dùng và những người truy cập Dịch vụ. Automate có quyền cập nhật các Điều khoản này bất cứ lúc nào. Việc tiếp tục sử dụng Dịch vụ sau khi có thay đổi đồng nghĩa với việc chấp nhận các Điều khoản đã cập nhật.`,
      },
      service: {
        heading: "2. Mô tả dịch vụ",
        body: `Automate là nền tảng kiểm thử tự động dựa trên web giúp các nhà phát triển phần mềm và kỹ sư QA:

• Tải lên mã nguồn (ZIP) hoặc kết nối kho lưu trữ GitHub/Google
• Tạo kịch bản kiểm thử Playwright bằng phân tích AI
• Thực thi kiểm thử tự động bao gồm UI, API và kiểm thử chức năng
• Chụp ảnh màn hình và ghi video từ các lần chạy kiểm thử
• Xem và tải xuống báo cáo chất lượng và kết quả kiểm thử

Dịch vụ được cung cấp "nguyên trạng" và có thể được cập nhật, sửa đổi hoặc ngừng cung cấp bất cứ lúc nào.`,
      },
      accounts: {
        heading: "3. Đăng ký tài khoản",
        body: `Để truy cập Dịch vụ, bạn phải tạo tài khoản bằng cách cung cấp thông tin chính xác và đầy đủ. Bạn có thể đăng ký bằng:

• Email và mật khẩu
• Google OAuth
• GitHub OAuth

Bạn chịu trách nhiệm duy trì bảo mật thông tin đăng nhập tài khoản và toàn bộ hoạt động xảy ra dưới tài khoản của mình. Bạn phải thông báo ngay cho Automate tại legal@automate.io nếu nghi ngờ có truy cập trái phép.

Bạn phải đủ 16 tuổi trở lên để sử dụng Dịch vụ. Bằng cách tạo tài khoản, bạn xác nhận rằng bạn đáp ứng yêu cầu này và tất cả thông tin đăng ký bạn cung cấp là trung thực và chính xác.`,
      },
      "acceptable-use": {
        heading: "4. Chính sách sử dụng hợp lệ",
        body: `Bạn đồng ý không sử dụng Dịch vụ để:

• Tải lên mã nguồn hoặc tệp độc hại, có hại hoặc bất hợp pháp
• Cố gắng dịch ngược, giải mã hoặc tháo rời bất kỳ phần nào của nền tảng
• Lạm dụng, thao túng hoặc khai thác hệ thống tín dụng hoặc đăng ký
• Chia sẻ thông tin đăng nhập tài khoản hoặc token truy cập với các bên không được ủy quyền
• Thực hiện thu thập dữ liệu tự động hoặc yêu cầu API quá mức làm giảm hiệu suất nền tảng
• Tải lên mã vi phạm quyền sở hữu trí tuệ của bên thứ ba
• Vượt qua bất kỳ biện pháp bảo mật, giới hạn tốc độ hoặc kiểm soát truy cập nào

Vi phạm chính sách này có thể dẫn đến đình chỉ hoặc chấm dứt tài khoản ngay lập tức mà không được hoàn tiền.`,
      },
      ip: {
        heading: "5. Quyền sở hữu trí tuệ",
        body: `Nội dung người dùng: Bạn giữ toàn quyền sở hữu tất cả mã nguồn, kịch bản kiểm thử và các nội dung khác bạn tải lên Dịch vụ ("Nội dung người dùng"). Bằng cách tải lên, bạn cấp cho Automate giấy phép hạn chế, không độc quyền để xử lý Nội dung người dùng của bạn chỉ nhằm mục đích cung cấp Dịch vụ.

Nền tảng: Automate giữ toàn bộ quyền, danh nghĩa và lợi ích đối với nền tảng, bao gồm các mô hình AI, cơ sở hạ tầng thực thi kiểm thử, giao diện người dùng và các khung kiểm thử được tạo ra. Không có điều gì trong các Điều khoản này chuyển quyền sở hữu nền tảng cho bạn.

Báo cáo & Kết quả kiểm thử: Báo cáo kiểm thử, nhật ký và dữ liệu kết quả được tạo ra thuộc sở hữu của bạn. Automate có thể lưu giữ số liệu thống kê tổng hợp ẩn danh cho mục đích cải thiện nền tảng.`,
      },
      payments: {
        heading: "6. Thanh toán & Tín dụng",
        body: `Automate hoạt động theo mô hình tín dụng và/hoặc đăng ký.

Phương thức thanh toán: Thanh toán được thực hiện qua chuyển khoản ngân hàng bằng mã QR. Sau khi hoàn tất chuyển khoản, tín dụng hoặc quyền truy cập đăng ký sẽ được kích hoạt trong vòng một (1) ngày làm việc sau khi xác nhận.

Tín dụng: Tín dụng đã mua không được hoàn tiền sau khi đã sử dụng. Tín dụng chưa sử dụng hết hạn sau [PLACEHOLDER: thời hạn].

Đăng ký: Phí đăng ký được tính định kỳ. Bạn có thể hủy đăng ký bất cứ lúc nào; việc hủy có hiệu lực vào cuối kỳ thanh toán hiện tại.

Hoàn tiền: Automate không hoàn tiền cho tín dụng đã sử dụng hoặc các kỳ đăng ký đã qua, trừ khi luật pháp hiện hành yêu cầu.

Thay đổi giá: Automate có quyền thay đổi giá với thông báo ít nhất 14 ngày cho người dùng đã đăng ký.`,
      },
      "data-storage": {
        heading: "7. Lưu trữ & Bảo lưu dữ liệu",
        body: `Automate lưu giữ dữ liệu của bạn theo lịch trình sau:

• Mã nguồn đã tải lên (tệp ZIP): Tự động xóa 30 ngày sau khi hoàn thành kiểm thử
• Nhật ký thực thi kiểm thử: Lưu giữ 30 ngày, sau đó xóa vĩnh viễn
• Báo cáo và kết quả kiểm thử: Có thể tải xuống trong 30 ngày, sau đó xóa
• Ảnh chụp màn hình và video ghi lại: Lưu giữ 30 ngày sau lần chạy kiểm thử
• Dữ liệu tài khoản (email, tên, tên người dùng): Lưu giữ khi tài khoản hoạt động và 90 ngày sau khi xóa tài khoản
• Hồ sơ thanh toán: Lưu giữ 7 năm theo quy định tài chính

Bạn chịu trách nhiệm tải xuống và sao lưu bất kỳ báo cáo kiểm thử hoặc tệp đính kèm nào bạn muốn giữ lại trước khi hết thời hạn lưu giữ 30 ngày.`,
      },
      "third-party": {
        heading: "8. Tích hợp bên thứ ba",
        body: `Dịch vụ tích hợp với các dịch vụ bên thứ ba bao gồm:

• GitHub — để truy cập kho lưu trữ và xác thực OAuth
• Google — để xác thực OAuth và phân tích
• Supabase — cho cơ sở dữ liệu và cơ sở hạ tầng xác thực
• Cloudflare R2 — để lưu trữ tệp
• PostHog & Mixpanel — để phân tích sản phẩm

Việc bạn sử dụng các tích hợp này phải tuân theo điều khoản dịch vụ tương ứng của bên thứ ba. Automate không chịu trách nhiệm về tính khả dụng hoặc hành vi của các dịch vụ bên thứ ba.

Khi bạn kết nối GitHub hoặc Google với tài khoản của mình, bạn cho phép Automate chỉ truy cập các phạm vi bạn phê duyệt trong quá trình OAuth. Bạn có thể thu hồi các quyền này bất cứ lúc nào thông qua cài đặt tài khoản GitHub hoặc Google của bạn.`,
      },
      disclaimers: {
        heading: "9. Từ chối bảo đảm",
        body: `DỊCH VỤ ĐƯỢC CUNG CẤP "NGUYÊN TRẠNG" VÀ "KHI CÓ SẴN" MÀ KHÔNG CÓ BẤT KỲ BẢO ĐẢM NÀO, DÙ RÕ RÀNG HAY NGỤ Ý, BAO GỒM NHƯNG KHÔNG GIỚI HẠN Ở BẢO ĐẢM VỀ KHẢ NĂNG BÁN, PHÙ HỢP CHO MỤC ĐÍCH CỤ THỂ VÀ KHÔNG VI PHẠM.

Automate không bảo đảm rằng:
• Dịch vụ sẽ liên tục hoặc không có lỗi
• Kết quả kiểm thử do Dịch vụ tạo ra sẽ chính xác hoặc đầy đủ
• Dịch vụ sẽ đáp ứng các yêu cầu cụ thể của bạn

Bạn sử dụng Dịch vụ theo rủi ro của riêng mình.`,
      },
      liability: {
        heading: "10. Giới hạn trách nhiệm",
        body: `TRONG PHẠM VI TỐI ĐA ĐƯỢC PHÉP BỞI LUẬT PHÁP HIỆN HÀNH, AUTOMATE SẼ KHÔNG CHỊU TRÁCH NHIỆM VỀ BẤT KỲ THIỆT HẠI GIÁN TIẾP, NGẪU NHIÊN, ĐẶC BIỆT, HẬU QUẢ HOẶC TRỪNG PHẠT NÀO, BAO GỒM MẤT LỢI NHUẬN, DỮ LIỆU HOẶC CƠ HỘI KINH DOANH.

TỔNG TRÁCH NHIỆM CỦA AUTOMATE ĐỐI VỚI BẠN VỀ BẤT KỲ KHIẾU NẠI NÀO SẼ KHÔNG VƯỢT QUÁ SỐ TIỀN LỚN HƠN TRONG HAI SỐ SAU: (A) SỐ TIỀN BẠN ĐÃ THANH TOÁN CHO AUTOMATE TRONG 12 THÁNG TRƯỚC KHIẾU NẠI HOẶC (B) 100 USD.`,
      },
      termination: {
        heading: "11. Chấm dứt",
        body: `Bạn có thể chấm dứt tài khoản bất cứ lúc nào bằng cách liên hệ legal@automate.io hoặc sử dụng tính năng xóa tài khoản trong cài đặt hồ sơ.

Automate có thể đình chỉ hoặc chấm dứt tài khoản của bạn ngay lập tức, không cần thông báo trước, nếu bạn:
• Vi phạm các Điều khoản hoặc Chính sách sử dụng hợp lệ
• Có hành vi gian lận hoặc lạm dụng
• Không thanh toán phí áp dụng

Sau khi chấm dứt:
• Quyền truy cập của bạn vào Dịch vụ sẽ bị thu hồi ngay lập tức
• Mã nguồn, nhật ký kiểm thử và báo cáo đã tải lên sẽ bị xóa trong vòng 30 ngày
• Dữ liệu tài khoản sẽ được lưu giữ 90 ngày trước khi xóa vĩnh viễn
• Tín dụng và phí đăng ký đã thanh toán không được hoàn tiền`,
      },
      "governing-law": {
        heading: "12. Luật áp dụng & Giải quyết tranh chấp",
        body: `Các Điều khoản này được điều chỉnh bởi các nguyên tắc được quốc tế công nhận về luật thương mại. Đối với người dùng tại Liên minh Châu Âu, các quyền GDPR và bảo vệ người tiêu dùng EU được áp dụng và có ưu tiên cao hơn khi thích hợp.

Tranh chấp: Mọi tranh chấp phát sinh từ các Điều khoản này trước tiên sẽ được giải quyết thông qua đàm phán thiện chí. Nếu không được giải quyết trong vòng 30 ngày, tranh chấp sẽ được đệ trình lên trọng tài ràng buộc theo quy tắc của [PLACEHOLDER: cơ quan trọng tài], với thủ tục tố tụng được tiến hành bằng tiếng Anh.`,
      },
      changes: {
        heading: "13. Thay đổi điều khoản",
        body: `Automate có quyền sửa đổi các Điều khoản này bất cứ lúc nào. Khi thực hiện thay đổi đáng kể, chúng tôi sẽ:

• Gửi thông báo qua email đến địa chỉ email đã đăng ký của bạn
• Hiển thị thông báo trên nền tảng ít nhất 14 ngày trước khi thay đổi có hiệu lực

Việc bạn tiếp tục sử dụng Dịch vụ sau ngày có hiệu lực của Điều khoản cập nhật đồng nghĩa với việc chấp nhận các thay đổi.`,
      },
      contact: {
        heading: "14. Liên hệ",
        body: `Để có câu hỏi về các Điều khoản này, vui lòng liên hệ:

Nhóm pháp lý Automate
Email: legal@automate.io
[PLACEHOLDER: Địa chỉ công ty]

Chúng tôi cố gắng trả lời tất cả các yêu cầu trong vòng 5 ngày làm việc.`,
      },
    },
  },
};

export default function TermsOfService() {
  const [lang, setLang] = useState("en");
  const t = content[lang];

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
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Contents
            </p>
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
            <h1
              className="text-4xl font-bold text-slate-900"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {t.title}
            </h1>
            <p className="mt-3 text-lg text-slate-500">{t.subtitle}</p>
          </div>

          <div className="space-y-12">
            {sections.map((s) => {
              const sec = t.sections[s.id];
              return (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2
                    className="mb-4 text-xl font-semibold text-slate-900"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {sec.heading}
                  </h2>
                  <div className="prose prose-slate max-w-none">
                    {sec.body.split("\n\n").map((para, i) => (
                      <p key={i} className="mb-4 leading-7 text-slate-600 whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                  </div>
                  <hr className="mt-10 border-slate-100" />
                </section>
              );
            })}
          </div>

          {/* Related links */}
          <div className="mt-16 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="w-full text-sm font-medium text-slate-700">Related legal documents:</p>
            <Link
              to="/privacy-policy"
              className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700"
            >
              Privacy Policy
            </Link>
            <Link
              to="/cookie-policy"
              className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700"
            >
              Cookie Policy
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
