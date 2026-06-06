import { Link } from "react-router-dom";

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

  const t = content.en;
  const dataRows = dataTable.en;
  const processorRows = processors.en;
  const retentionRows = retentionTable.en;

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
                    headers={["Category", "Data Points"]}
                    rows={dataRows.map((r) => [r.category, r.data])} />

                  }

                  {s.id === "sharing" &&
                  <Table
                    headers={["Processor", "Role", "Data Shared"]}
                    rows={processorRows.map((r) => [r.name, r.role, r.data])} />

                  }

                  {s.id === "retention" &&
                  <Table
                    headers={["Data Type", "Retention Period", "Reason"]}
                    rows={retentionRows.map((r) => [r.type, r.period, r.reason])} />

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
            <Link to="/cookie-policy" className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">
              Cookie Policy
            </Link>
          </div>
        </main>
      </div>
    </div>);

}
