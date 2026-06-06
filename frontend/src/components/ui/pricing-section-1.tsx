"use client";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import HeroParticleNetwork from "@/components/landing/HeroParticleNetwork";
import NumberFlow from "@number-flow/react";
import {
  ArrowRight,
  Check,
  Clock,
  Code2,
  Coins,
  Gauge,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const plusFeatures = [
  "15 standard test runs every month",
  "Optional code fix suggestions",
  "Better test generation engine",
  "Monthly allowance resets each billing cycle",
  "Extra runs can continue with credits",
];

const creditFeatures = [
  "$1 per credit",
  "Minimum top-up: 4 credits",
  "Credits do not expire",
  "Use credits for larger or extra runs",
  "Pay only when your team needs more capacity",
];

const comparison = [
  { label: "Free trial", plus: "2 credits", credits: "2 credits on signup" },
  { label: "Best for", plus: "Regular monthly testing", credits: "Flexible extra usage" },
  { label: "Allowance", plus: "15 standard tests/month", credits: "Usage-based credits" },
  { label: "Overage", plus: "Buy credits anytime", credits: "Top up from 4 credits" },
];

const revealVariants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { delay: i * 0.12, duration: 0.55 },
  }),
  hidden: {
    filter: "blur(10px)",
    y: 24,
    opacity: 0,
  },
};

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-7 space-y-3.5">
      {items.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Check className="h-3.5 w-3.5" />
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function PricingConsole() {
  return (
    <div className="relative z-20">
      <motion.div
        aria-hidden="true"
        animate={{ y: [-5, 5, -5], rotate: [-0.8, 0.8, -0.8] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-3 -top-8 z-30 hidden w-34 rounded-md border border-slate-200 bg-white/95 px-3 py-2.5 shadow-lg shadow-slate-900/10 backdrop-blur md:block xl:-left-5"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400">Free trial</p>
        <p className="mt-0.5 text-lg font-bold text-slate-950">2 credits</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "64%" }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="h-full rounded-full bg-orange-500"
          />
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        animate={{ y: [6, -5, 6] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-7 right-7 z-30 hidden w-40 rounded-md border border-orange-200 bg-orange-50/95 px-3 py-2.5 shadow-lg shadow-orange-500/10 backdrop-blur md:block"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-500 pulse-dot" />
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-orange-700">Pay as you go</p>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-900">4 credit minimum</p>
      </motion.div>

      <div className="relative z-20 rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="overflow-hidden rounded-t-xl border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-3 flex-1 rounded border border-slate-200 bg-white px-3 py-1 text-xs font-mono text-slate-500">
            testpilot.app/pricing
          </div>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Plus usage</p>
                <p className="mt-1 text-sm text-slate-500">Monthly standard test allowance</p>
              </div>
              <div className="rounded-md bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">15 runs</div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "Plus", value: 10, prefix: "$", suffix: "/mo" },
                { label: "Runs", value: 15, prefix: "", suffix: "/mo" },
                { label: "Credit", value: 1, prefix: "$", suffix: "each" },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 flex items-baseline gap-1 text-2xl font-semibold text-slate-950">
                    {item.prefix}
                    <NumberFlow value={item.value} />
                    <span className="text-xs font-medium text-slate-500">{item.suffix}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: "Standard tests", width: "88%" },
                { label: "Fix suggestions", width: "62%" },
                { label: "Extra credit capacity", width: "74%" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-500">ready</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: item.width }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full bg-orange-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-slate-400">Subscribe</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Plus is coming soon</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-slate-400">Credits</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Available through billing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingSection2() {
  const pricingRef = useRef<HTMLDivElement>(null);
  const [creditAmount, setCreditAmount] = useState(4);
  const total = creditAmount;
  const billingPath = useMemo(() => (
    typeof window !== "undefined" && localStorage.getItem("token") ? "/billing" : "/login"
  ), []);

  return (
    <main ref={pricingRef} className="relative overflow-hidden bg-white">
      <HeroParticleNetwork />
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid opacity-90 [mask-image:radial-gradient(ellipse_at_center,black_52%,transparent_92%)]" />

      <section className="relative z-10 border-b border-slate-200/80 bg-white/5">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-[0.98fr_1.02fr] md:px-8 lg:py-20">
          <div>
            <TimelineContent
              as="div"
              animationNum={0}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
              v2.4 — Pricing engine
            </TimelineContent>

            <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.08}
                staggerFrom="first"
                reverse
                containerClassName="items-center"
                transition={{ type: "spring", stiffness: 230, damping: 34, delay: 0.15 }}
              >
                Pricing that scales with every test.
              </VerticalCutReveal>
            </h1>

            <TimelineContent
              as="p"
              animationNum={1}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-600"
            >
              Start with 2 free credits. Use Plus for 15 standard test runs each month, then keep momentum with flexible credits whenever your project needs more room.
            </TimelineContent>

            <TimelineContent
              as="div"
              animationNum={2}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to={billingPath}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition-colors hover:bg-orange-600"
              >
                Start with 2 credit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to={billingPath}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400"
              >
                Buy credit
                <Coins className="h-4 w-4" />
              </Link>
            </TimelineContent>

            <TimelineContent
              as="ul"
              animationNum={3}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"
            >
              {["2 free credits", "$10 Plus plan", "$1 per credit"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-orange-500" />
                  {item}
                </li>
              ))}
            </TimelineContent>
          </div>

          <TimelineContent
            as="div"
            animationNum={4}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="relative"
          >
            <PricingConsole />
          </TimelineContent>
        </div>
      </section>

      <section className="relative z-10 border-b border-slate-200 bg-slate-50/90 py-20 backdrop-blur-sm md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <TimelineContent
            as="div"
            animationNum={5}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="mb-10 max-w-3xl"
          >
            <div className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-orange-600">Plans</div>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Two ways to keep your testing pipeline moving.
            </h2>
          </TimelineContent>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <TimelineContent
              as="article"
              animationNum={6}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="group relative overflow-hidden rounded-lg border-2 border-orange-500 bg-white p-7 shadow-2xl shadow-orange-500/10 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-orange-500" />
              <div className="absolute right-6 top-6 rounded-md bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                Best value
              </div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-slate-950">Plus</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                For developers who test regularly and want a predictable monthly bill.
              </p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-tight text-slate-950">$10</span>
                <span className="pb-2 text-sm font-medium text-slate-500">/month</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Monthly runs</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">15</p>
                </div>
                <div className="rounded-md bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Extra runs</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">Credits</p>
                </div>
              </div>
              <FeatureList items={plusFeatures} />
              <button
                type="button"
                disabled
                className="mt-8 inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-5 text-sm font-bold text-slate-500"
              >
                Subscribe
                <Clock className="h-4 w-4" />
              </button>
            </TimelineContent>

            <TimelineContent
              as="article"
              animationNum={7}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-violet-500" />
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                <Coins className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-slate-950">Credits</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                For occasional testing, larger runs, or usage beyond the Plus allowance.
              </p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-tight text-slate-950">$1</span>
                <span className="pb-2 text-sm font-medium text-slate-500">/credit</span>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Top up</p>
                    <p className="mt-1 text-sm text-slate-600">Minimum 4 credits</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditAmount((value) => Math.max(4, value - 1))}
                      className="h-9 w-9 rounded-md border border-slate-300 bg-white text-lg font-semibold text-slate-700 transition-colors hover:border-slate-400"
                      aria-label="Decrease credits"
                    >
                      -
                    </button>
                    <div className="flex h-9 min-w-14 items-center justify-center rounded-md bg-white px-3 text-sm font-bold text-slate-950 ring-1 ring-slate-200">
                      {creditAmount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreditAmount((value) => value + 1)}
                      className="h-9 w-9 rounded-md border border-slate-300 bg-white text-lg font-semibold text-slate-700 transition-colors hover:border-slate-400"
                      aria-label="Increase credits"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
                  <span className="text-sm font-medium text-slate-600">Estimated total</span>
                  <span className="text-2xl font-bold text-slate-950">${total}</span>
                </div>
              </div>

              <FeatureList items={creditFeatures} />
              <Link
                to={billingPath}
                className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-950 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                Buy credit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </TimelineContent>
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-white/90 py-16 backdrop-blur-sm md:py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <TimelineContent
            as="div"
            animationNum={8}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {[
              { icon: Gauge, title: "Fair-use standard runs", text: "Plus is tuned for normal project sizes and repeat testing workflows." },
              { icon: Code2, title: "Fix suggestions included", text: "Ask TestPilot to propose code changes when a generated test exposes a defect." },
              { icon: ShieldCheck, title: "No lock-in", text: "Use monthly tests first, then credits for extra or heavier runs." },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-6">
                <item.icon className="h-5 w-5 text-orange-500" />
                <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </TimelineContent>

          <TimelineContent
            as="div"
            animationNum={9}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="mt-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              <span>Detail</span>
              <span>Plus</span>
              <span>Credits</span>
            </div>
            {comparison.map((row) => (
              <div key={row.label} className="grid grid-cols-3 gap-3 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0">
                <span className="font-medium text-slate-900">{row.label}</span>
                <span className="text-slate-600">{row.plus}</span>
                <span className="text-slate-600">{row.credits}</span>
              </div>
            ))}
          </TimelineContent>

          <TimelineContent
            as="div"
            animationNum={10}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="mt-10 flex flex-col items-start justify-between gap-4 rounded-lg bg-slate-950 p-6 text-white md:flex-row md:items-center"
          >
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-orange-300">
                <Clock className="h-4 w-4" />
                Ready when your next release is.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Free users get 2 credits to try TestPilot before choosing Plus or pay-as-you-go credits.
              </p>
            </div>
            <Link
              to={billingPath}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100"
            >
              Start with 2 credit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </TimelineContent>
        </div>
      </section>
    </main>
  );
}
