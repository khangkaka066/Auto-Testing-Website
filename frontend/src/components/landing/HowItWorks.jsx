import React, { useRef } from "react";
import { SectionHeader } from "./Features";
import { Root, Animation } from "@bsmnt/scrollytelling";
import { howItWorksT } from "../../content/landing";

export default function HowItWorks() {
  const t = howItWorksT;

  const headerRef = useRef(null);
  const s1 = useRef(null), s2 = useRef(null), s3 = useRef(null), s4 = useRef(null);
  const stepRefs = [s1, s2, s3, s4];

  return (
    <Root start="top 85%" end="top 15%" scrub={1}>
      <section id="how" data-testid="how-it-works-section" className="py-24 md:py-32 border-b border-slate-200">
        <Animation tween={{ target: headerRef, start: 0, end: 40, fromTo: [{ opacity: 0, y: 35 }, { opacity: 1, y: 0 }] }} />
        <Animation tween={stepRefs.map((ref, i) => ({
          target: ref, start: 15 + i * 15, end: 55 + i * 15,
          fromTo: [{ opacity: 0, y: 50 }, { opacity: 1, y: 0 }],
        }))} />

        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div ref={headerRef}>
            <SectionHeader label={t.header.label} title={t.header.title} subtitle={t.header.subtitle} />
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {t.steps.map((s, i) => (
              <div key={i} ref={stepRefs[i]} data-testid={`how-step-${i + 1}`} className="bg-white p-8 group hover:bg-orange-50/40 transition-colors">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-5xl font-bold text-slate-200 group-hover:text-orange-300 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">{t.stepLabel}</span>
                </div>
                <h3 className="font-display mt-6 text-xl font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed text-[15px]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Root>
  );
}
