import React, { useRef } from "react";
import { Sparkles, Globe, Eye, GitBranch, Zap, ShieldCheck } from "lucide-react";
import { Root, Animation } from "@bsmnt/scrollytelling";
import { useLanguage } from "../../context/LanguageContext";
import { featuresT } from "../../i18n/landing";

const ICONS = [
  <Sparkles className="h-5 w-5" />,
  <Eye className="h-5 w-5" />,
  <Globe className="h-5 w-5" />,
  <GitBranch className="h-5 w-5" />,
  <Zap className="h-5 w-5" />,
  <ShieldCheck className="h-5 w-5" />,
];

const TESTIDS = [
  "feature-ai-authoring",
  "feature-visual",
  "feature-cross-browser",
  "feature-cicd",
  "feature-speed",
  "feature-security",
];

export default function Features() {
  const { lang } = useLanguage();
  const t = featuresT[lang];

  const headerRef = useRef(null);
  const c1 = useRef(null), c2 = useRef(null), c3 = useRef(null);
  const c4 = useRef(null), c5 = useRef(null), c6 = useRef(null);
  const cardRefs = [c1, c2, c3, c4, c5, c6];

  return (
    <Root start="top 85%" end="top 15%" scrub={1}>
      <section id="features" data-testid="features-section" className="py-24 md:py-32 border-b border-slate-200 bg-slate-50/40">
        <Animation tween={{ target: headerRef, start: 0, end: 45, fromTo: [{ opacity: 0, y: 35 }, { opacity: 1, y: 0 }] }} />
        <Animation tween={cardRefs.map((ref, i) => ({
          target: ref,
          start: 10 + i * 8,
          end: 55 + i * 6,
          fromTo: [{ opacity: 0, y: 55 }, { opacity: 1, y: 0 }],
        }))} />

        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div ref={headerRef}>
            <SectionHeader label={t.header.label} title={t.header.title} subtitle={t.header.subtitle} />
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-6 gap-5">
            <FeatureCard ref={c1} className="md:col-span-3 md:row-span-2" testid={TESTIDS[0]} icon={ICONS[0]} title={t.cards[0].title} description={t.cards[0].description}>
              <div className="mt-6 rounded-md bg-slate-900 border border-slate-800 p-5 text-sm font-mono shadow-xl">
                <div className="text-slate-500">{t.cards[0].codeComment}</div>
                <div className="text-slate-300 mt-1">
                  <span className="text-orange-400">test</span>(
                  <span className="text-emerald-300">'user can complete checkout'</span>, async () =&gt; {"{"}
                </div>
                <div className="text-slate-300 pl-4">await page.goto(<span className="text-emerald-300">'/cart'</span>);</div>
                <div className="text-slate-300 pl-4">await page.click(<span className="text-emerald-300">'[data-testid=checkout]'</span>);</div>
                <div className="text-slate-300 pl-4">await expect(orderConfirm).<span className="text-orange-400">toBeVisible</span>();</div>
                <div className="text-slate-300">{"}"});</div>
              </div>
            </FeatureCard>

            {[1, 2, 3, 4, 5].map((i) => (
              <FeatureCard key={i} ref={cardRefs[i]} className={i < 3 ? "md:col-span-3" : "md:col-span-2"} testid={TESTIDS[i]} icon={ICONS[i]} title={t.cards[i].title} description={t.cards[i].description} />
            ))}
          </div>
        </div>
      </section>
    </Root>
  );
}

export function SectionHeader({ label, title, subtitle, align = "left" }) {
  return (
    <div className={align === "center" ? "max-w-3xl mx-auto text-center" : "max-w-3xl"}>
      <div className="text-xs font-mono uppercase tracking-[0.2em] text-orange-600 font-semibold">{label}</div>
      <h2 className="font-display mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {subtitle && <p className="mt-4 text-lg leading-relaxed text-slate-600">{subtitle}</p>}
    </div>
  );
}

const FeatureCard = React.forwardRef(function FeatureCard({ className = "", testid, icon, title, description, children }, ref) {
  return (
    <div ref={ref} data-testid={testid} className={`group bg-white border border-slate-200 rounded-lg p-7 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600 border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="font-display mt-5 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600 leading-relaxed">{description}</p>
      {children}
    </div>
  );
});
