import React from "react";
import { Check } from "lucide-react";
import { SectionHeader } from "./Features";

const tiers = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    desc: "Perfect for solo developers and side projects.",
    features: [
      "500 test runs / month",
      "1 user, 1 project",
      "Community support",
      "Chrome only",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "49",
    period: "per month",
    desc: "For teams that ship to production every day.",
    features: [
      "25,000 test runs / month",
      "Unlimited projects",
      "All browsers & mobile viewports",
      "AI test authoring & self-healing",
      "GitHub, GitLab, Slack integrations",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual contract",
    desc: "Compliance, SSO and dedicated infrastructure.",
    features: [
      "Unlimited test runs",
      "SSO/SAML, SCIM, audit logs",
      "Dedicated runners & region",
      "SOC 2 Type II report",
      "Custom SLA & onboarding",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      data-testid="pricing-section"
      className="py-24 md:py-32 border-b border-slate-200 bg-slate-50/40"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <SectionHeader
          label="Pricing"
          title="Pay for runs, not for seats."
          subtitle="Simple plans that grow with your team. No surprise overage fees, ever."
          align="center"
        />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((t) => (
            <div
              key={t.name}
              data-testid={`pricing-tier-${t.name.toLowerCase()}`}
              className={`relative rounded-lg p-8 transition-all ${
                t.highlighted
                  ? "bg-slate-900 text-white border border-slate-900 shadow-2xl shadow-slate-900/10 lg:scale-105"
                  : "bg-white border border-slate-200 hover:border-slate-300"
              }`}
            >
              {t.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-block px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-mono uppercase tracking-[0.18em] font-semibold">
                    Most popular
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl font-semibold">{t.name}</h3>
              </div>
              <p className={`mt-2 text-sm ${t.highlighted ? "text-slate-300" : "text-slate-600"}`}>
                {t.desc}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                {t.price === "Custom" ? (
                  <span className="font-display text-5xl font-bold tracking-tight">Custom</span>
                ) : (
                  <>
                    <span className={`text-2xl font-medium ${t.highlighted ? "text-slate-400" : "text-slate-500"}`}>$</span>
                    <span className="font-display text-5xl font-bold tracking-tight">{t.price}</span>
                    <span className={`text-sm ${t.highlighted ? "text-slate-400" : "text-slate-500"}`}>
                      / {t.period}
                    </span>
                  </>
                )}
              </div>

              <a
                href="#"
                data-testid={`pricing-cta-${t.name.toLowerCase()}`}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-md px-5 py-3 font-medium transition-colors ${
                  t.highlighted
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {t.cta}
              </a>

              <ul className={`mt-8 space-y-3 text-sm ${t.highlighted ? "text-slate-200" : "text-slate-700"}`}>
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        t.highlighted ? "text-orange-400" : "text-orange-500"
                      }`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
