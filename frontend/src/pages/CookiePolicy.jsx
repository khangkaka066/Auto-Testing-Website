import { Link } from "react-router-dom";

const LAST_UPDATED = "June 6, 2026";

const sections = [
{ id: "what-are-cookies", en: "1. What Are Cookies" },
{ id: "inventory", en: "2. Cookie Inventory" },
{ id: "categories", en: "3. Cookie Categories" },
{ id: "consent", en: "4. Consent" },
{ id: "managing", en: "5. Managing Cookies" },
{ id: "impact", en: "6. Impact of Disabling Cookies" },
{ id: "changes", en: "7. Changes to This Policy" },
{ id: "contact", en: "8. Contact" }];


const cookieInventory = {
  en: [
  {
    name: "sb-auth-token",
    tool: "Supabase",
    category: "Essential",
    purpose: "Maintains your authenticated session. Required for login to work.",
    duration: "Session / 1 week (remember me)",
    party: "First-party"
  },
  {
    name: "sb-refresh-token",
    tool: "Supabase",
    category: "Essential",
    purpose: "Refreshes your authentication token silently to keep you logged in.",
    duration: "30 days",
    party: "First-party"
  },
  {
    name: "oauth_state",
    tool: "GitHub / Google OAuth",
    category: "Essential",
    purpose: "CSRF protection token during OAuth login flow. Deleted after login completes.",
    duration: "Session (minutes)",
    party: "First-party"
  },
  {
    name: "ui_preferences",
    tool: "LocalStorage",
    category: "Functional",
    purpose: "Remembers your UI preferences (theme, language, dashboard layout).",
    duration: "Persistent",
    party: "First-party"
  },
  {
    name: "_ga, _ga_*",
    tool: "Google Analytics",
    category: "Analytics",
    purpose: "Tracks page views, sessions, and traffic sources to understand how users navigate the platform.",
    duration: "2 years",
    party: "Third-party (Google)"
  },
  {
    name: "ph_*",
    tool: "PostHog",
    category: "Analytics",
    purpose: "Tracks feature usage events and session behavior to guide product improvements.",
    duration: "1 year",
    party: "Third-party (PostHog)"
  },
  {
    name: "mp_*",
    tool: "Mixpanel",
    category: "Analytics",
    purpose: "Tracks user behavior events and funnel analysis.",
    duration: "1 year",
    party: "Third-party (Mixpanel)"
  }]



























































};

const categoryBadge = {
  Essential: "bg-green-100 text-green-700",
  Functional: "bg-blue-100 text-blue-700",
  Analytics: "bg-orange-100 text-orange-700",
  "Thiết yếu": "bg-green-100 text-green-700",
  "Chức năng": "bg-blue-100 text-blue-700",
  "Phân tích": "bg-orange-100 text-orange-700"
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

Automate uses cookies and similar technologies to operate the Service, keep you authenticated, and understand how the platform is used so we can improve it.`
      },
      inventory: {
        heading: "2. Cookie Inventory",
        body: `The table below lists all cookies and storage items used on the Automate platform:`
      },
      categories: {
        heading: "3. Cookie Categories",
        body: `We use three categories of cookies:

Essential / Strictly Necessary
These cookies are required for the Service to function. They manage your authentication session (Supabase auth tokens) and protect against CSRF attacks during OAuth logins (GitHub, Google). You cannot opt out of these cookies without breaking core functionality.

Functional / Preference
These store your UI preferences such as theme and language. They improve your experience but are not required for the Service to work.

Analytics & Performance
These cookies (Google Analytics, PostHog, Mixpanel) help us understand how users interact with the platform — which features are used, where users drop off, and how to prioritize improvements. These are optional and require your consent under GDPR.`
      },
      consent: {
        heading: "4. Consent",
        body: `Essential cookies: Do not require consent as they are strictly necessary to provide the Service.

Analytics cookies: Require your consent. When you first visit the platform, a cookie consent banner will be displayed. You may accept or decline analytics cookies.

Withdrawing consent: You can withdraw consent for analytics cookies at any time via your account settings or by using the browser opt-out methods listed below. Withdrawing consent does not affect the lawfulness of processing prior to withdrawal.`
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
• Mixpanel: https://mixpanel.com/optout`
      },
      impact: {
        heading: "6. Impact of Disabling Cookies",
        body: `Essential cookies (Supabase auth tokens, OAuth state):
Disabling these cookies will prevent you from logging in and using authenticated features of the Service. The platform requires these to function.

Functional cookies (ui_preferences):
Disabling these means the platform will not remember your display preferences between sessions.

Analytics cookies (Google Analytics, PostHog, Mixpanel):
Disabling analytics cookies has no impact on your ability to use the Service. All features remain fully accessible.`
      },
      changes: {
        heading: "7. Changes to This Policy",
        body: `We may update this Cookie Policy when we add or remove tracking technologies. We will notify you of material changes via email or a platform notice. The "Last updated" date above reflects the current version.`
      },
      contact: {
        heading: "8. Contact",
        body: `For questions about our use of cookies:

Email: legal@automate.io
[PLACEHOLDER: Company address]

We will respond within 5 business days.`
      }
    }
  }
















































































};

export default function CookiePolicy() {

  const t = content.en;
  const inventory = cookieInventory.en;

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
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:flex lg:gap-16">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Contents</p>
            <nav className="space-y-1">
              {sections.map((s) =>
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-md px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600">

                  {s.en}
                </a>
              )}
            </nav>
            {/* Category legend */}
            <div className="mt-6 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Categories</p>
              {[
              { label: "Essential", cls: "bg-green-100 text-green-700" },
              { label: "Functional", cls: "bg-blue-100 text-blue-700" },
              { label: "Analytics", cls: "bg-orange-100 text-orange-700" }].
              map((c) =>
              <span key={c.label} className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mr-1 ${c.cls}`}>
                  {c.label}
                </span>
              )}
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

                  {sec.body &&
                  <div className="mb-4">
                      {sec.body.split("\n\n").map((para, i) =>
                    <p key={i} className="mb-4 leading-7 text-slate-600 whitespace-pre-line">
                          {para}
                        </p>
                    )}
                    </div>
                  }

                  {s.id === "inventory" &&
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            {
                          ["Cookie / Key", "Tool", "Category", "Purpose", "Duration", "Party"].

                          map((h) =>
                          <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {h}
                              </th>
                          )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inventory.map((row, i) =>
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
                        )}
                        </tbody>
                      </table>
                    </div>
                  }

                  <hr className="mt-10 border-slate-100" />
                </section>);

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
    </div>);

}
