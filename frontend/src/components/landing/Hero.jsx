import React from "react";
import { ArrowRight, Check, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Root, Parallax } from "@bsmnt/scrollytelling";
import { useT } from "../../lib/i18n";

export default function Hero() {
  const { heroT: t } = useT("landing");

  return (
    <section
      data-testid="hero-section"
      className="relative overflow-hidden border-b border-slate-200"
    >
<div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div
              className="hero-fade-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-200 bg-orange-50"
              style={{ animationDelay: "0ms" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-orange-700 font-semibold">
                {t.badge}
              </span>
            </div>

            <h1
              data-testid="hero-heading"
              className="hero-fade-in font-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.02]"
              style={{ animationDelay: "140ms" }}
            >
              {t.headline1}<br />
              {t.headline2} <span className="relative inline-block">
                <span className="relative z-10">{t.highlight}</span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-orange-200/70 -z-0"></span>
              </span>.
            </h1>

            <p
              className="hero-fade-in mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
              style={{ animationDelay: "260ms" }}
            >
              {t.subtitle}
            </p>

            <div
              className="hero-fade-in mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{ animationDelay: "370ms" }}
            >
              <Link
                to="/pricing"
                data-testid="hero-primary-cta"
                className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3.5 rounded-md transition-all shadow-sm hover:shadow-md"
              >
                {t.primaryCta}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how"
                data-testid="hero-secondary-cta"
                className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium px-2 py-3.5"
              >
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-900 text-white">
                  <Play className="h-3 w-3 ml-0.5" />
                </span>
                {t.secondaryCta}
              </a>
            </div>

            <ul
              className="hero-fade-in mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"
              style={{ animationDelay: "480ms" }}
            >
              {t.benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-orange-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 relative">
            <Root start="top top" end="bottom top">
            <Parallax tween={{ start: 0, end: 100, movementY: { value: -55, unit: "px" } }}>
            <div className="relative">
              <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-orange-100 via-white to-slate-100 blur-2xl opacity-70" />
              <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/5 overflow-hidden animate-float">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400"></span>
                  <div className="ml-3 flex-1 text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded px-3 py-1">
                    testpilot.app/runs/47ba
                  </div>
                </div>
                {/* Body */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">
                        {t.liveRun}
                      </div>
                      <div className="font-display font-semibold text-slate-900 mt-0.5">
                        {t.checkoutFlow}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      {t.passing}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { step: "visit('/cart')", t: "0.4s", ok: true },
                      { step: "click('checkout-btn')", t: "0.2s", ok: true },
                      { step: "fill('email', user.email)", t: "0.3s", ok: true },
                      { step: "expect(orderConfirm).visible", t: "1.1s", ok: true },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          <code className="text-xs font-mono text-slate-700 truncate">
                            {row.step}
                          </code>
                        </div>
                        <span className="text-xs font-mono text-slate-400 flex-shrink-0">{row.t}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <Stat label={t.statLabels.tests} value="248" />
                    <Stat label={t.statLabels.passed} value="247" accent />
                    <Stat label={t.statLabels.duration} value="42s" />
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="hidden md:flex absolute -bottom-2 -left-3 items-center gap-2 bg-white border border-slate-200 shadow-lg rounded-md px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-orange-500 pulse-dot"></span>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400">
                    {t.aiAuthor}
                  </div>
                  <div className="text-xs font-medium text-slate-900">
                    {t.generated}
                  </div>
                </div>
              </div>
            </div>
            </Parallax>
            </Root>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className={`font-display font-semibold text-lg ${accent ? "text-orange-600" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}
