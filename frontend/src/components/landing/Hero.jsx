import React from "react";
import { ArrowRight, Check, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Root, Parallax } from "@bsmnt/scrollytelling";
import { useLanguage } from "../../context/LanguageContext";
import { heroT } from "../../i18n/landing";

export default function Hero() {
  const { lang } = useLanguage();
  const t = heroT[lang];

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
            <Parallax tween={{ start: 0, end: 100, fromTo: [{ y: 0 }, { y: -30 }] }}>
              <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
                <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-800">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <span className="ml-2 text-xs text-slate-400 font-mono">{t.liveRun} · {t.checkoutFlow}</span>
                  <span className="ml-auto text-xs font-mono text-green-400">{t.passing}</span>
                </div>

                <div className="p-5 space-y-3 bg-slate-950">
                  {[
                    { label: "navigate /cart", status: "pass", dur: "120ms" },
                    { label: "[data-testid=checkout]", status: "pass", dur: "45ms" },
                    { label: "expect orderConfirm.toBeVisible", status: "pass", dur: "230ms" },
                    { label: "expect total.$30.00", status: "pass", dur: "18ms" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-mono">
                      <span className="shrink-0 h-4 w-4 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-green-400" />
                      </span>
                      <span className="text-slate-300 flex-1 truncate">{row.label}</span>
                      <span className="text-slate-600">{row.dur}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-between text-xs">
                  <div className="flex gap-5">
                    <span className="text-slate-500">{t.statLabels.tests} <strong className="text-slate-900 font-semibold">12</strong></span>
                    <span className="text-slate-500">{t.statLabels.passed} <strong className="text-green-600 font-semibold">12</strong></span>
                    <span className="text-slate-500">{t.statLabels.duration} <strong className="text-slate-900 font-semibold">1.4s</strong></span>
                  </div>
                  <span className="font-mono text-orange-500 font-semibold text-[10px] uppercase tracking-wider">{t.aiAuthor}</span>
                </div>
              </div>
            </Parallax>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 hidden md:block">
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-lg flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{t.aiAuthor}</div>
                  <div className="text-[11px] text-slate-500">{t.generated}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Root>
  );
}
