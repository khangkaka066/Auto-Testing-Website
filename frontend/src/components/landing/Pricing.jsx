import React, { useRef } from "react";
import { Check } from "lucide-react";
import { SectionHeader } from "./Features";
import { Root, Animation } from "@bsmnt/scrollytelling";
import { pricingT } from "../../content/landing";

export default function Pricing() {
  const t = pricingT;

  const headerRef = useRef(null);
  const t1 = useRef(null), t2 = useRef(null);
  const tierRefs = [t1, t2];

  return (
    <Root start="top 85%" end="top 15%" scrub={1}>
      <section id="pricing" data-testid="pricing-section" className="py-24 md:py-32 border-b border-slate-200 bg-slate-50/40">
        <Animation tween={{ target: headerRef, start: 0, end: 40, fromTo: [{ opacity: 0, y: 35 }, { opacity: 1, y: 0 }] }} />
        <Animation tween={tierRefs.map((ref, i) => ({
          target: ref, start: 15 + i * 18, end: 58 + i * 14,
          fromTo: [{ opacity: 0, y: 50, scale: 0.94 }, { opacity: 1, y: 0, scale: 1 }],
        }))} />

        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div ref={headerRef}>
            <SectionHeader label={t.header.label} title={t.header.title} subtitle={t.header.subtitle} align="center" />
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-5xl mx-auto">
            {t.tiers.map((tier, i) => (
              <div key={tier.name} ref={tierRefs[i]} data-testid={`pricing-tier-${tier.name.toLowerCase()}`}
                className={`relative rounded-lg p-8 ${tier.highlighted ? "border-2 border-orange-500 shadow-xl shadow-orange-500/10 bg-white" : "border border-slate-200 bg-white"}`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-mono tracking-[0.18em] font-semibold">
                      {t.mostPopular}
                    </span>
                  </div>
                )}
                <h3 className="font-display text-xl font-semibold text-slate-900">{tier.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{tier.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  {tier.price !== "Custom" && tier.price !== "Liên hệ" ? (
                    <>
                      <span className="text-4xl font-bold text-slate-900">${tier.price}</span>
                      <span className="text-slate-500 text-sm">/{tier.period}</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                  )}
                </div>
                <ul className="mt-8 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#" data-testid={`pricing-cta-${tier.name.toLowerCase()}`}
                  className={`mt-8 block w-full text-center py-2.5 rounded-md text-sm font-medium transition-colors ${
                    tier.highlighted ? "bg-orange-500 hover:bg-orange-600 text-white" : "border border-slate-200 hover:border-slate-300 text-slate-900"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Root>
  );
}
