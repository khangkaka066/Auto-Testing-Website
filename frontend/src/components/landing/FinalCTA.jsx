import React, { useRef } from "react";
import { ArrowRight } from "lucide-react";
import CTAIcosahedron from "./CTAIcosahedron";
import { Root, Animation } from "@bsmnt/scrollytelling";
import { finalCtaT } from "../../content/landing";

export default function FinalCTA() {
  const t = finalCtaT;

  const badgeRef = useRef(null);
  const headingRef = useRef(null);
  const paraRef = useRef(null);
  const ctaRef = useRef(null);

  return (
    <Root start="top 80%" end="top 15%" scrub={1}>
      <section data-testid="final-cta-section" className="relative overflow-hidden bg-slate-900 text-white">
        <Animation tween={{ target: badgeRef,   start: 0,  end: 35, fromTo: [{ opacity: 0, y: 20 }, { opacity: 1, y: 0 }] }} />
        <Animation tween={{ target: headingRef, start: 10, end: 55, fromTo: [{ opacity: 0, y: 45, scale: 0.9 }, { opacity: 1, y: 0, scale: 1 }] }} />
        <Animation tween={{ target: paraRef,    start: 28, end: 68, fromTo: [{ opacity: 0, y: 30 }, { opacity: 1, y: 0 }] }} />
        <Animation tween={{ target: ctaRef,     start: 45, end: 82, fromTo: [{ opacity: 0, y: 25 }, { opacity: 1, y: 0 }] }} />

        <CTAIcosahedron />
        <div className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[40rem] bg-orange-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32 text-center">
          <div ref={badgeRef} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-orange-300 font-semibold">{t.badge}</span>
          </div>

          <h2 ref={headingRef} className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            {t.headline1}<br />
            <span className="text-orange-400">{t.headline2}</span>
          </h2>

          <p ref={paraRef} className="mt-6 max-w-2xl mx-auto text-lg text-slate-300 leading-relaxed">{t.paragraph}</p>

          <div ref={ctaRef} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#" data-testid="final-cta-primary"
              className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-7 py-3.5 rounded-md transition-colors"
            >
              {t.primaryCta}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="#" data-testid="final-cta-secondary"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/40 text-white font-medium px-7 py-3.5 rounded-md transition-colors"
            >
              {t.secondaryCta}
            </a>
          </div>
        </div>
      </section>
    </Root>
  );
}
