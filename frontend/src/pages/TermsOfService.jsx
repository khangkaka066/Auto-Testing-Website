import { Link } from "react-router-dom";

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




























































































































































};

export default function TermsOfService() {

  const t = content.en;

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
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Contents
            </p>
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
            <h1
              className="text-4xl font-bold text-slate-900"
              style={{ fontFamily: "'Outfit', sans-serif" }}>

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
            <p className="w-full text-sm font-medium text-slate-700">Related legal documents:</p>
            <Link
              to="/privacy-policy"
              className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">

              Privacy Policy
            </Link>
            <Link
              to="/cookie-policy"
              className="text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700">

              Cookie Policy
            </Link>
          </div>
        </main>
      </div>
    </div>);

}
