import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/ui/LanguageToggle";

const LAST_UPDATED = "June 6, 2026";

const sections = [
  { id: "what-are-cookies", en: "1. What Are Cookies", vi: "1. Cookie là gì" },
  { id: "inventory", en: "2. Cookie Inventory", vi: "2. Danh sách cookie" },
  { id: "categories", en: "3. Cookie Categories", vi: "3. Phân loại cookie" },
  { id: "consent", en: "4. Consent", vi: "4. Sự đồng ý" },
  { id: "managing", en: "5. Managing Cookies", vi: "5. Quản lý cookie" },
  { id: "impact", en: "6. Impact of Disabling Cookies", vi: "6. Ảnh hưởng khi tắt cookie" },
  { id: "changes", en: "7. Changes to This Policy", vi: "7. Thay đổi chính sách" },
  { id: "contact", en: "8. Contact", vi: "8. Liên hệ" },
];

const cookieInventory = {
  en: [
    {
      name: "sb-auth-token",
      tool: "Supabase",
      category: "Essential",
      purpose: "Maintains your authenticated session. Required for login to work.",
      duration: "Session / 1 week (remember me)",
      party: "First-party",
    },
    {
      name: "sb-refresh-token",
      tool: "Supabase",
      category: "Essential",
      purpose: "Refreshes your authentication token silently to keep you logged in.",
      duration: "30 days",
      party: "First-party",
    },
    {
      name: "oauth_state",
      tool: "GitHub / Google OAuth",
      category: "Essential",
      purpose: "CSRF protection token during OAuth login flow. Deleted after login completes.",
      duration: "Session (minutes)",
      party: "First-party",
    },
    {
      name: "ui_preferences",
      tool: "LocalStorage",
      category: "Functional",
      purpose: "Remembers your UI preferences (theme, language, dashboard layout).",
      duration: "Persistent",
      party: "First-party",
    },
    {
      name: "_ga, _ga_*",
      tool: "Google Analytics",
      category: "Analytics",
      purpose: "Tracks page views, sessions, and traffic sources to understand how users navigate the platform.",
      duration: "2 years",
      party: "Third-party (Google)",
    },
    {
      name: "ph_*",
      tool: "PostHog",
      category: "Analytics",
      purpose: "Tracks feature usage events and session behavior to guide product improvements.",
      duration: "1 year",
      party: "Third-party (PostHog)",
    },
    {
      name: "mp_*",
      tool: "Mixpanel",
      category: "Analytics",
      purpose: "Tracks user behavior events and funnel analysis.",
      duration: "1 year",
      party: "Third-party (Mixpanel)",
    },
  ],
  vi: [
    {
      name: "sb-auth-token",
      tool: "Supabase",
      category: "Thiết yếu",
      purpose: "Duy trì phiên đăng nhập của bạn. Bắt buộc để đăng nhập hoạt động.",
      duration: "Phiên / 1 tuần (ghi nhớ đăng nhập)",
      party: "Bên thứ nhất",
    },
    {
      name: "sb-refresh-token",
      tool: "Supabase",
      category: "Thiết yếu",
      purpose: "Tự động làm mới token xác thực để duy trì đăng nhập.",
      duration: "30 ngày",
      party: "Bên thứ nhất",
    },
    {
      name: "oauth_state",
      tool: "GitHub / Google OAuth",
      category: "Thiết yếu",
      purpose: "Token bảo vệ CSRF trong quá trình đăng nhập OAuth. Bị xóa sau khi đăng nhập hoàn tất.",
      duration: "Phiên (vài phút)",
      party: "Bên thứ nhất",
    },
    {
      name: "ui_preferences",
      tool: "LocalStorage",
      category: "Chức năng",
      purpose: "Ghi nhớ tùy chọn giao diện (chủ đề, ngôn ngữ, bố cục bảng điều khiển).",
      duration: "Lâu dài",
      party: "Bên thứ nhất",
    },
    {
      name: "_ga, _ga_*",
      tool: "Google Analytics",
      category: "Phân tích",
      purpose: "Theo dõi lượt xem trang, phiên và nguồn lưu lượng truy cập.",
      duration: "2 năm",
      party: "Bên thứ ba (Google)",
    },
    {
      name: "ph_*",
      tool: "PostHog",
      category: "Phân tích",
      purpose: "Theo dõi sự kiện sử dụng tính năng và hành vi phiên để cải thiện sản phẩm.",
      duration: "1 năm",
      party: "Bên thứ ba (PostHog)",
    },
    {
      name: "mp_*",
      tool: "Mixpanel",
      category: "Phân tích",
      purpose: "Theo dõi sự kiện hành vi người dùng và phân tích kênh chuyển đổi.",
      duration: "1 năm",
      party: "Bên thứ ba (Mixpanel)",
    },
  ],
};

const categoryBadge = {
  Essential: "bg-green-100 text-green-700",
  Functional: "bg-blue-100 text-blue-700",
  Analytics: "bg-orange-100 text-orange-700",
  "Thiết yếu": "bg-green-100 text-green-700",
  "Chức năng": "bg-blue-100 text-blue-700",
  "Phân tích": "bg-orange-100 text-orange-700",
};

const content = {
  en: {
    title: "Cookie Policy",
    subtitle: "This policy explains how Automate uses cookies and similar tracking technologies.",
    sections: {
      "what-are-cookies": {
        heading: "1. What Are Cookies",
        body: `Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently, remember your preferences, and provide information to website owners.

"Similar technologies" include localStorage (browser storage) and session tokens, which we also use for authentication and preference storage.

Automate uses cookies and similar technologies to operate the Service, keep you authenticated, and understand how the platform is used so we can improve it.`,
      },
      inventory: {
        heading: "2. Cookie Inventory",
        body: `The table below lists all cookies and storage items used on the Automate platform:`,
      },
      categories: {
        heading: "3. Cookie Categories",
        body: `We use three categories of cookies:

Essential / Strictly Necessary
These cookies are required for the Service to function. They manage your authentication session (Supabase auth tokens) and protect against CSRF attacks during OAuth logins (GitHub, Google). You cannot opt out of these cookies without breaking core functionality.

Functional / Preference
These store your UI preferences such as theme and language. They improve your experience but are not required for the Service to work.

Analytics & Performance
These cookies (Google Analytics, PostHog, Mixpanel) help us understand how users interact with the platform — which features are used, where users drop off, and how to prioritize improvements. These are optional and require your consent under GDPR.`,
      },
      consent: {
        heading: "4. Consent",
        body: `Essential cookies: Do not require consent as they are strictly necessary to provide the Service.

Analytics cookies: Require your consent. When you first visit the platform, a cookie consent banner will be displayed. You may accept or decline analytics cookies.

Withdrawing consent: You can withdraw consent for analytics cookies at any time via your account settings or by using the browser opt-out methods listed below. Withdrawing consent does not affect the lawfulness of processing prior to withdrawal.`,
      },
      managing: {
        heading: "5. Managing Cookies",
        body: `Browser-level controls:
You can manage, block, or delete cookies through your browser settings:

• Chrome: Settings → Privacy and security → Cookies and other site data
• Firefox: Settings → Privacy & Security → Cookies and Site Data
• Safari: Preferences → Privacy → Manage Website Data
• Edge: Settings → Cookies and site permissions

Note: Blocking all cookies will prevent login and may break core Service functionality.

Tool-specific opt-outs:
• Google Analytics: https://tools.google.com/dlpage/gaoptout
• PostHog: Opt out via the "Do not track" setting in your browser, or contact us at legal@automate.io
• Mixpanel: https://mixpanel.com/optout`,
      },
      impact: {
        heading: "6. Impact of Disabling Cookies",
        body: `Essential cookies (Supabase auth tokens, OAuth state):
Disabling these cookies will prevent you from logging in and using authenticated features of the Service. The platform requires these to function.

Functional cookies (ui_preferences):
Disabling these means the platform will not remember your display preferences between sessions.

Analytics cookies (Google Analytics, PostHog, Mixpanel):
Disabling analytics cookies has no impact on your ability to use the Service. All features remain fully accessible.`,
      },
      changes: {
        heading: "7. Changes to This Policy",
        body: `We may update this Cookie Policy when we add or remove tracking technologies. We will notify you of material changes via email or a platform notice. The "Last updated" date above reflects the current version.`,
      },
      contact: {
        heading: "8. Contact",
        body: `For questions about our use of cookies:

Email: legal@automate.io
[PLACEHOLDER: Company address]

We will respond within 5 business days.`,
      },
    },
  },
  vi: {
    title: "Chính sách Cookie",
    subtitle: "Chính sách này giải thích cách Automate sử dụng cookie và các công nghệ theo dõi tương tự.",
    sections: {
      "what-are-cookies": {
        heading: "1. Cookie là gì",
        body: `Cookie là các tệp văn bản nhỏ được đặt trên thiết bị của bạn bởi các trang web bạn truy cập. Chúng được sử dụng rộng rãi để làm cho trang web hoạt động hiệu quả, ghi nhớ tùy chọn của bạn và cung cấp thông tin cho chủ sở hữu trang web.

"Công nghệ tương tự" bao gồm localStorage (lưu trữ trình duyệt) và token phiên, mà chúng tôi cũng sử dụng để xác thực và lưu trữ tùy chọn.

Automate sử dụng cookie và công nghệ tương tự để vận hành Dịch vụ, duy trì trạng thái đăng nhập và hiểu cách nền tảng được sử dụng để cải thiện nó.`,
      },
      inventory: {
        heading: "2. Danh sách cookie",
        body: `Bảng dưới đây liệt kê tất cả cookie và các mục lưu trữ được sử dụng trên nền tảng Automate:`,
      },
      categories: {
        heading: "3. Phân loại cookie",
        body: `Chúng tôi sử dụng ba loại cookie:

Thiết yếu / Bắt buộc
Các cookie này cần thiết để Dịch vụ hoạt động. Chúng quản lý phiên xác thực (token Supabase) và bảo vệ chống tấn công CSRF trong quá trình đăng nhập OAuth. Bạn không thể từ chối các cookie này mà không làm hỏng chức năng cốt lõi.

Chức năng / Tùy chọn
Các cookie này lưu trữ tùy chọn giao diện như chủ đề và ngôn ngữ. Chúng cải thiện trải nghiệm nhưng không bắt buộc để Dịch vụ hoạt động.

Phân tích & Hiệu suất
Các cookie này (Google Analytics, PostHog, Mixpanel) giúp chúng tôi hiểu cách người dùng tương tác với nền tảng. Chúng là tùy chọn và yêu cầu sự đồng ý của bạn theo GDPR.`,
      },
      consent: {
        heading: "4. Sự đồng ý",
        body: `Cookie thiết yếu: Không yêu cầu sự đồng ý vì chúng cần thiết để cung cấp Dịch vụ.

Cookie phân tích: Yêu cầu sự đồng ý của bạn. Khi bạn lần đầu truy cập nền tảng, một banner đồng ý cookie sẽ được hiển thị. Bạn có thể chấp nhận hoặc từ chối cookie phân tích.

Rút lại đồng ý: Bạn có thể rút lại đồng ý đối với cookie phân tích bất cứ lúc nào qua cài đặt tài khoản hoặc bằng các phương pháp từ chối trình duyệt được liệt kê bên dưới.`,
      },
      managing: {
        heading: "5. Quản lý cookie",
        body: `Kiểm soát cấp trình duyệt:
Bạn có thể quản lý, chặn hoặc xóa cookie qua cài đặt trình duyệt:

• Chrome: Cài đặt → Quyền riêng tư và bảo mật → Cookie và dữ liệu trang web khác
• Firefox: Cài đặt → Quyền riêng tư & Bảo mật → Cookie và dữ liệu trang web
• Safari: Tùy chọn → Quyền riêng tư → Quản lý dữ liệu trang web
• Edge: Cài đặt → Cookie và quyền trang web

Lưu ý: Chặn tất cả cookie sẽ ngăn đăng nhập và có thể phá vỡ chức năng cốt lõi.

Từ chối theo công cụ:
• Google Analytics: https://tools.google.com/dlpage/gaoptout
• PostHog: Dùng cài đặt "Do not track" trong trình duyệt hoặc liên hệ legal@automate.io
• Mixpanel: https://mixpanel.com/optout`,
      },
      impact: {
        heading: "6. Ảnh hưởng khi tắt cookie",
        body: `Cookie thiết yếu (token xác thực Supabase, OAuth state):
Tắt các cookie này sẽ ngăn bạn đăng nhập và sử dụng các tính năng được xác thực. Nền tảng yêu cầu các cookie này để hoạt động.

Cookie chức năng (ui_preferences):
Tắt các cookie này nghĩa là nền tảng sẽ không ghi nhớ tùy chọn hiển thị của bạn giữa các phiên.

Cookie phân tích (Google Analytics, PostHog, Mixpanel):
Tắt cookie phân tích không ảnh hưởng đến khả năng sử dụng Dịch vụ. Tất cả tính năng vẫn có thể truy cập đầy đủ.`,
      },
      changes: {
        heading: "7. Thay đổi chính sách này",
        body: `Chúng tôi có thể cập nhật Chính sách Cookie này khi thêm hoặc xóa các công nghệ theo dõi. Chúng tôi sẽ thông báo cho bạn về các thay đổi đáng kể qua email hoặc thông báo trên nền tảng.`,
      },
      contact: {
        heading: "8. Liên hệ",
        body: `Để có câu hỏi về việc chúng tôi sử dụng cookie:

Email: legal@automate.io
[PLACEHOLDER: Địa chỉ công ty]

Chúng tôi sẽ phản hồi trong vòng 5 ngày làm việc.`,
      },
    },
  },
};

export default function CookiePolicy() {
  const { lang } = useLanguage();
  const t = content[lang];
  const inventory = cookieInventory[lang];

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
          <LanguageToggle />
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
            {/* Category legend */}
            <div className="mt-6 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Categories</p>
              {[
                { label: lang === "en" ? "Essential" : "Thiết yếu", cls: "bg-green-100 text-green-700" },
                { label: lang === "en" ? "Functional" : "Chức năng", cls: "bg-blue-100 text-blue-700" },
                { label: lang === "en" ? "Analytics" : "Phân tích", cls: "bg-orange-100 text-orange-700" },
              ].map((c) => (
                <span key={c.label} className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mr-1 ${c.cls}`}>
                  {c.label}
                </span>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
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

                  {s.id === "inventory" && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            {(lang === "en"
                              ? ["Cookie / Key", "Tool", "Category", "Purpose", "Duration", "Party"]
                              : ["Cookie / Key", "Công cụ", "Loại", "Mục đích", "Thời hạn", "Bên"]
                            ).map((h) => (
                              <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inventory.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-3 font-mono text-xs text-slate-800">{row.name}</td>
                              <td className="px-3 py-3 text-slate-600">{row.tool}</td>
                              <td className="px-3 py-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryBadge[row.category] || "bg-slate-100 text-slate-600"}`}>
                                  {row.category}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-600 max-w-xs">{row.purpose}</td>
                              <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.duration}</td>
                              <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{row.party}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
            <Link to="/privacy-policy" className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">
              Privacy Policy
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
