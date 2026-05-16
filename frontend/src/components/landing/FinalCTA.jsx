import React from "react";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section
      data-testid="final-cta-section"
      className="relative overflow-hidden bg-slate-900 text-white"
    >
      <div className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[40rem] bg-orange-500/20 blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-orange-300 font-semibold">
            Start in 60 seconds
          </span>
        </div>

        <h2 className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Stop chasing bugs.<br />
          <span className="text-orange-400">Start shipping.</span>
        </h2>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-300 leading-relaxed">
          Join thousands of teams using TestPilot to release software with confidence — no flaky
          tests, no late-night rollbacks.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#"
            data-testid="final-cta-primary"
            className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-7 py-3.5 rounded-md transition-colors"
          >
            Start free — no card needed
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="#"
            data-testid="final-cta-secondary"
            className="inline-flex items-center gap-2 border border-white/15 hover:border-white/40 text-white font-medium px-7 py-3.5 rounded-md transition-colors"
          >
            Book a demo
          </a>
        </div>
      </div>
    </section>
  );
}
