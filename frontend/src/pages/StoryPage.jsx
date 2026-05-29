import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import StoryCanvas from "../components/story/StoryCanvas";

gsap.registerPlugin(ScrollTrigger);

// ─── Chapter data ─────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: "I",   label: "The Problem",
    title: ["Testing is", "Broken."],
    body: "Every release is a gamble. Flaky tests, missed regressions, and midnight alerts are the tax your team pays for shipping fast.",
    bg: "#0f172a", lineHex: 0xf97316, accent: "#f97316",
    textClass: "text-white", subClass: "text-slate-400",
    stat: { value: "63%", label: "of engineering teams delay releases due to broken tests" },
  },
  {
    id: "II",  label: "The Shift",
    title: ["AI Rewrites", "the Rules."],
    body: "TestPilot watches your codebase, writes tests in plain English, and self-heals when your UI changes. No test engineer required.",
    bg: "#1a2744", lineHex: 0xfb923c, accent: "#fb923c",
    textClass: "text-white", subClass: "text-slate-400",
    stat: { value: "98.6%", label: "reduction in flaky tests reported after switching to TestPilot" },
  },
  {
    id: "III", label: "How It Works",
    title: ["Four Moves.", "Green Builds."],
    body: "Connect your repo. Describe a flow in plain English. Run on every commit. Let TestPilot heal drifted selectors automatically.",
    bg: "#f8fafc", lineHex: 0x334155, accent: "#f97316",
    textClass: "text-slate-900", subClass: "text-slate-500",
    steps: ["Connect repo", "Describe flow", "Run on commit", "Auto-heal"],
    stat: { value: "60s", label: "from sign-up to first green build — that's all it takes" },
  },
  {
    id: "IV",  label: "The Impact",
    title: ["4,200+ Teams", "Shipping Faster."],
    body: "From solo devs to Fortune 500 engineering teams. TestPilot pays for itself in the first sprint.",
    bg: "#431407", lineHex: 0xfed7aa, accent: "#fdba74",
    textClass: "text-white", subClass: "text-orange-200",
    stat: { value: "10×", label: "faster test suite execution compared to traditional frameworks" },
  },
  {
    id: "V",   label: "Start Today",
    title: ["Your Story", "Starts Now."],
    body: "Join thousands of teams shipping with confidence. No credit card. No DevOps degree. Just faster, safer releases from day one.",
    bg: "#0c0a09", lineHex: 0xf97316, accent: "#f97316",
    textClass: "text-white", subClass: "text-slate-400",
    isCTA: true,
    stat: { value: "Free", label: "forever on the starter plan — upgrade only when you're ready" },
  },
];

// ─── Stat counter ──────────────────────────────────────────────────────────
function startCounter(el, rawValue) {
  const m = rawValue.match(/^([^0-9]*)([\d.]+)(.*)$/);
  if (!m) return;
  const prefix = m[1], num = parseFloat(m[2]), suffix = m[3];
  const decimals = num % 1 !== 0 ? 1 : 0;
  const dur = 1300, t0 = performance.now();
  const step = (now) => {
    const p  = Math.min((now - t0) / dur, 1);
    const ep = 1 - Math.pow(1 - p, 4);
    el.textContent = prefix + (ep * num).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = rawValue;
  };
  requestAnimationFrame(step);
}

// ─── Chapter ───────────────────────────────────────────────────────────────
function Chapter({ data, index, colorRef }) {
  const sectionRef  = useRef(null);
  const statValRef  = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const triggers = [];

    // Pin section for one extra viewport of scrolling
    triggers.push(ScrollTrigger.create({
      trigger: el, start: "top top", end: "+=100%",
      pin: true, anticipatePin: 1, pinSpacing: true,
    }));

    // Update Three.js canvas colors
    triggers.push(ScrollTrigger.create({
      trigger: el, start: "top 65%",
      onEnter:     () => { colorRef.current = { bg: data.bg, lineHex: data.lineHex }; },
      onEnterBack: () => { colorRef.current = { bg: data.bg, lineHex: data.lineHex }; },
    }));

    // IntersectionObserver for CSS-class entrance animations
    const DELAYS = [0, 80, 160, 260, 380, 500, 600, 700, 800];
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();

      // Fire scan sweep
      const scan = document.getElementById("story-scan");
      if (scan) {
        scan.style.background = data.accent;
        gsap.fromTo(scan,
          { y: "0vh", opacity: 0.75, scaleX: 1 },
          { y: "105vh", opacity: 0, duration: 0.85, ease: "power2.in" }
        );
      }

      // Reveal all animated elements
      const lines  = el.querySelectorAll(".story-line");
      const fades  = el.querySelectorAll(".story-fade");
      const draws  = el.querySelectorAll(".story-draw");
      const scales = el.querySelectorAll(".story-scale");
      const all    = [...lines, ...fades, ...draws, ...scales];

      all.forEach((item, i) => {
        setTimeout(() => item.classList.add("animate-in"), DELAYS[i] ?? i * 90);
      });

      // Start stat counter after a short delay
      if (statValRef.current) {
        setTimeout(() => startCounter(statValRef.current, data.stat.value), 400);
      }

      // Update canvas color immediately
      colorRef.current = { bg: data.bg, lineHex: data.lineHex };
    }, { threshold: 0.05 });
    io.observe(el);

    return () => { triggers.forEach(st => st?.kill()); io.disconnect(); };
  }, [data, colorRef]);

  const isDark = data.bg !== "#f8fafc";

  return (
    <section
      ref={sectionRef}
      style={{ minHeight: "100vh", background: data.bg }}
      className="relative will-change-transform"
    >
      <div className="relative z-10 min-h-screen flex flex-col justify-center max-w-6xl mx-auto px-8 md:px-16 py-24">

        {/* ── Badge + progress dots ── */}
        <div className="story-fade flex items-center gap-4 mb-6">
          <span
            className="font-mono text-xs uppercase tracking-[0.32em] font-bold px-3 py-1.5 rounded-full border"
            style={{ color: data.accent, borderColor: data.accent + "55", background: data.accent + "18" }}
          >
            Chapter {data.id}
          </span>
          <span className={`font-mono text-xs uppercase tracking-[0.25em] ${data.subClass}`}>
            {data.label}
          </span>
          <div className="flex gap-2 ml-auto">
            {CHAPTERS.map((_, i) => (
              <span key={i} className="block rounded-full transition-all duration-600"
                style={{
                  width:  i === index ? 24 : 7, height: 7,
                  background: i === index ? data.accent : (isDark ? "#ffffff25" : "#33415540"),
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Accent draw-line ── */}
        <div
          className="story-draw mb-8 h-px"
          style={{ background: `linear-gradient(to right, ${data.accent}, transparent)` }}
        />

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
          <div className="lg:col-span-7">

            {/* Title line 1 */}
            <div className="story-line-wrap">
              <h2
                className={`story-line font-display font-black tracking-tight leading-[0.92] ${data.textClass}`}
                style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
              >
                {data.title[0]}
              </h2>
            </div>

            {/* Title line 2 */}
            <div className="story-line-wrap mb-8">
              <h2
                className={`story-line font-display font-black tracking-tight leading-[0.92] ${data.textClass}`}
                style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
              >
                <span style={{ color: data.accent }}>{data.title[1].split(" ")[0]}</span>
                {" "}{data.title[1].split(" ").slice(1).join(" ")}
              </h2>
            </div>

            {/* Body */}
            <p className={`story-fade text-[1.1rem] leading-relaxed max-w-lg ${data.subClass}`}>
              {data.body}
            </p>

            {/* Steps (Ch. III) */}
            {data.steps && (
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.steps.map((step, i) => (
                  <div key={i} className="story-scale rounded-xl p-4 border"
                    style={{ borderColor: data.accent + "35", background: data.accent + "0e" }}
                  >
                    <span className="block font-mono text-2xl font-black" style={{ color: data.accent }}>
                      0{i + 1}
                    </span>
                    <span className={`block mt-2 text-sm font-semibold ${data.textClass}`}>{step}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA (Ch. V) */}
            {data.isCTA && (
              <div className="story-fade mt-12 flex flex-wrap gap-4">
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 hover:brightness-110"
                  style={{ background: data.accent, color: "#fff" }}
                >
                  Start free — no card needed <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 font-medium px-8 py-4 rounded-xl border transition-all hover:bg-white/10"
                  style={{ borderColor: data.accent + "44", color: data.accent }}
                >
                  View the full site
                </Link>
              </div>
            )}
          </div>

          {/* ── Stat card ── */}
          <div className="lg:col-span-5">
            <div
              className="story-fade rounded-2xl p-10 border relative overflow-hidden"
              style={{ borderColor: data.accent + "30", background: data.accent + "0d" }}
            >
              {/* Glow blob */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                style={{ background: data.accent + "30" }}
              />
              <div
                ref={statValRef}
                className="relative font-display font-black leading-none"
                style={{ fontSize: "clamp(4rem, 8vw, 5.5rem)", color: data.accent }}
              >
                {data.stat.value}
              </div>
              <p className={`relative mt-4 text-sm leading-relaxed ${data.subClass}`} style={{ maxWidth: 240 }}>
                {data.stat.label}
              </p>
            </div>
          </div>
        </div>

        {/* Scroll hint — Ch. I only */}
        {index === 0 && (
          <div className="story-fade absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <span className={`font-mono text-[11px] uppercase tracking-[0.32em] ${data.subClass}`}>
              Scroll to read
            </span>
            <div className="h-12 w-px animate-pulse"
              style={{ background: `linear-gradient(to bottom, ${data.accent}, transparent)` }}
            />
          </div>
        )}
      </div>

      {/* Side chapter number */}
      <div
        className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-2"
        style={{ zIndex: 10 }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-[0.3em] rotate-90 origin-center"
          style={{ color: data.accent + "80", writingMode: "vertical-rl" }}
        >
          {data.id} / V
        </span>
      </div>
    </section>
  );
}

// ─── StoryPage ─────────────────────────────────────────────────────────────
export default function StoryPage() {
  const colorRef = useRef({ bg: CHAPTERS[0].bg, lineHex: CHAPTERS[0].lineHex });

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const rafCb = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCb);
    gsap.ticker.lagSmoothing(0);

    const t = setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => {
      clearTimeout(t);
      lenis.destroy();
      gsap.ticker.remove(rafCb);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <>
      {/* Three.js hand-drawn canvas */}
      <StoryCanvas colorRef={colorRef} />

      {/* GSAP scan-sweep element (full-width, fixed) */}
      <div
        id="story-scan"
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: "2px", zIndex: 60, pointerEvents: "none",
          transformOrigin: "left center", opacity: 0,
        }}
      />

      {/* Back button */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-4 py-2.5 rounded-full backdrop-blur-md border transition-all hover:bg-white/10"
        style={{ borderColor: "#ffffff28", color: "#ffffffbb" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to site
      </Link>

      <div className="relative" style={{ zIndex: 1 }}>
        {CHAPTERS.map((chapter, i) => (
          <Chapter key={chapter.id} data={chapter} index={i} colorRef={colorRef} />
        ))}
      </div>
    </>
  );
}
