import React from "react";
import { ArrowRight, Bot, Check, Play, Sparkles, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { Root, Parallax } from "@bsmnt/scrollytelling";
import { heroT } from "../../content/landing";

export default function Hero() {
  const t = heroT;

  return (
    <Root start="top 100%" end="top 0%" scrub={1}>
      <section
        data-testid="hero-section"
        className="relative overflow-hidden border-b border-slate-200"
      >
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="hero-fade-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm text-xs font-mono uppercase tracking-[0.18em] text-orange-600 font-semibold shadow-sm"
              style={{ animationDelay: "0ms" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              {t.badge}
            </div>

            <h1
              ref={undefined}
              data-testid="hero-heading"
              className="hero-fade-in font-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.03] text-slate-900"
              style={{ animationDelay: "80ms" }}
            >
              {t.headline1}<br />
              {t.headline2} <span className="text-orange-500">{t.highlight}.</span>
            </h1>

            <p
              className="hero-fade-in mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
              style={{ animationDelay: "160ms" }}
            >
              {t.subtitle}
            </p>

            <div
              className="hero-fade-in mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                to="/register"
                data-testid="hero-primary-cta"
                className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-md transition-colors shadow-lg shadow-orange-500/25"
              >
                {t.primaryCta}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                data-testid="hero-secondary-cta"
                className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium px-6 py-3 rounded-md transition-colors"
              >
                <Play className="h-4 w-4 text-orange-500" />
                {t.secondaryCta}
              </button>
            </div>

            <div
              className="hero-fade-in mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500"
              style={{ animationDelay: "320ms" }}
            >
              {t.benefits.map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="hero-fade-in relative" style={{ animationDelay: "120ms" }}>
            <Parallax tween={{ start: 0, end: 100, movementY: { value: 30, unit: "px" } }}>
              <div className="relative mx-auto max-w-xl lg:max-w-none">
                <div className="absolute -inset-4 rounded-[2rem] bg-orange-200/25 blur-3xl" />
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                  <div className="border-b border-slate-200 bg-slate-100/90 px-4 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-400 shadow-inner" />
                        <span className="h-3 w-3 rounded-full bg-amber-400 shadow-inner" />
                        <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-inner" />
                      </div>
                      <div className="flex min-w-0 flex-1 items-end gap-1">
                        <div className="min-w-0 rounded-t-lg border border-b-0 border-slate-200 bg-white px-3 py-2 shadow-sm">
                          <p className="truncate font-mono text-[11px] font-semibold text-slate-700">
                            {t.checkoutFlow}
                          </p>
                        </div>
                        <div className="hidden rounded-t-lg px-3 py-2 font-mono text-[11px] text-slate-400 sm:block">
                          {t.liveRun}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {t.passing}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-orange-300" />
                        <span className="font-mono text-xs font-semibold text-slate-200">{t.aiAuthor}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">{t.generated}</span>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { label: "navigate /cart", dur: "120ms" },
                        { label: "[data-testid=checkout]", dur: "45ms" },
                        { label: "expect orderConfirm.toBeVisible", dur: "230ms" },
                        { label: "expect total.$30.00", dur: "18ms" },
                      ].map((row, i) => (
                        <div key={row.label} className="group flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-3 text-xs font-mono transition-colors hover:border-emerald-400/30 hover:bg-slate-900">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
                            <Check className="h-3 w-3 text-emerald-300" />
                          </span>
                          <span className="w-5 shrink-0 text-slate-600">{String(i + 1).padStart(2, "0")}</span>
                          <span className="min-w-0 flex-1 truncate text-slate-200">{row.label}</span>
                          <span className="text-slate-500">{row.dur}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 bg-white">
                    {[
                      { label: t.statLabels.tests, value: "12" },
                      { label: t.statLabels.passed, value: "12", tone: "text-emerald-600" },
                      { label: t.statLabels.duration, value: "1.4s" },
                    ].map((stat) => (
                      <div key={stat.label} className="px-4 py-4">
                        <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                        <p className={`mt-1 text-lg font-bold tabular-nums ${stat.tone || "text-slate-900"}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{t.aiAuthor}</p>
                      <p className="truncate text-xs text-slate-500">{t.generated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <Timer className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">1.4s</p>
                      <p className="text-xs text-slate-500">Full run completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </Parallax>
          </div>
        </div>
      </section>
    </Root>
  );
}
