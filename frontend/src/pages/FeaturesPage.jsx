import React from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  Github,
  Brain,
  ListChecks,
  Play,
  Radio,
  BarChart3,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Upload,
    title: "Upload Source Code",
    description:
      "Drop a .zip archive of your project and the system instantly unpacks, indexes, and prepares it for the AI pipeline — no setup required.",
    badge: "ZIP Upload",
    highlights: ["Drag-and-drop interface", "Auto-extract & index", "Supports any web framework"],
  },
  {
    icon: Github,
    title: "GitHub Integration",
    description:
      "Connect via GitHub OAuth, select any repository and branch, and kick off a full test run directly from your source on GitHub.",
    badge: "OAuth",
    highlights: ["One-click OAuth", "Choose repo & branch", "Works with private repos"],
  },
  {
    icon: Brain,
    title: "AI Source Code Analysis",
    description:
      "Our AI scans your entire project — detecting frontend, backend, and database layers — then builds a rich context model to drive precise test generation.",
    badge: "AI",
    highlights: ["Stack detection", "Dependency mapping", "Semantic code understanding"],
  },
  {
    icon: ListChecks,
    title: "Automated Test Case Generation",
    description:
      "The AI planner produces a complete test suite covering UI flows, API endpoints, and functional behaviour — tailored to your actual codebase.",
    badge: "Test Planning",
    highlights: ["UI Testing", "API Testing", "Functional Testing"],
  },
  {
    icon: Play,
    title: "Playwright Test Execution",
    description:
      "Generated tests are validated, auto-healed on syntax errors, and executed in an isolated workspace powered by Playwright — with up to 3 self-repair cycles.",
    badge: "Playwright",
    highlights: ["Auto-generated specs", "Self-healing tests", "Isolated sandbox"],
  },
  {
    icon: Radio,
    title: "Real-time Progress Tracking",
    description:
      "Watch the pipeline advance step-by-step in near real-time: scan → analyse → plan → generate → validate → run → report, with per-stage percentages.",
    badge: "Live",
    highlights: ["Per-stage progress", "Sub-task breakdown", "Error notifications"],
  },
  {
    icon: BarChart3,
    title: "Visual Test Reports",
    description:
      "Every run produces a health score out of 100, a pass/fail breakdown, total runtime, and a prioritised list of issues with severity levels.",
    badge: "Reports",
    highlights: ["Health score 0–100", "Pass / fail breakdown", "Severity-ranked issues"],
  },
  {
    icon: LayoutDashboard,
    title: "Test History & Dashboard",
    description:
      "The dashboard surfaces your latest quality score, credit balance, GitHub connection status, and a full history of every test run at a glance.",
    badge: "Dashboard",
    highlights: ["Run history", "Credit tracking", "GitHub status"],
  },
];

const WORKFLOW_STEPS = [
  { label: "Upload or Connect GitHub", sub: "ZIP or OAuth" },
  { label: "AI Analyses Source Code", sub: "Stack detection" },
  { label: "Generate Test Cases", sub: "UI · API · Functional" },
  { label: "Run Playwright Tests", sub: "Isolated sandbox" },
  { label: "View Visual Report", sub: "Score · Issues" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({ feature, index }) {
  const Icon = feature.icon;
  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl p-7 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col gap-5">
      {/* Index watermark */}
      <span className="absolute top-5 right-6 text-5xl font-display font-bold text-slate-100 select-none">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="flex items-start gap-4">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-orange-500 font-semibold">
            {feature.badge}
          </span>
          <h3 className="font-display mt-0.5 text-lg font-semibold text-slate-900 leading-snug">
            {feature.title}
          </h3>
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>

      <ul className="mt-auto space-y-1.5">
        {feature.highlights.map((h) => (
          <li key={h} className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-orange-400 shrink-0" />
            {h}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkflowStep({ step, index, total }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-0">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-orange-500 text-white font-display font-bold text-lg flex items-center justify-center shadow-md shadow-orange-200">
          {index + 1}
        </div>
        {index < total - 1 && (
          <ChevronRight className="absolute -right-5 h-4 w-4 text-slate-300 hidden lg:block" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 leading-tight">{step.label}</p>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">{step.sub}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 pt-28 pb-20 md:pt-36 md:pb-28">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 md:px-8 text-center">
          <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] text-orange-600 font-semibold mb-5">
            Platform Features
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Powerful features for{" "}
            <span className="text-orange-500">automated web testing</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            From source code to detailed test reports — TestPilot handles the entire QA
            pipeline so your team can focus on building.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors shadow-sm"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="py-20 md:py-28 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-orange-600 font-semibold">
              All capabilities
            </span>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Eight core capabilities that cover the full testing lifecycle — no
              configuration required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section className="py-20 md:py-28 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-orange-600 font-semibold">
              How it works
            </span>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              From source code to report in minutes
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              The pipeline runs fully autonomously — you only need to point it at your code.
            </p>
          </div>

          <div className="relative bg-white border border-slate-200 rounded-2xl px-8 py-10 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-4">
              {WORKFLOW_STEPS.map((step, i) => (
                <WorkflowStep key={step.label} step={step} index={i} total={WORKFLOW_STEPS.length} />
              ))}
            </div>

            {/* Mobile connector */}
            <div className="lg:hidden mt-6 border-l-2 border-dashed border-orange-200 ml-6 pl-6 space-y-4">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 font-medium">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Report Highlight ── */}
      <section className="py-20 md:py-28 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-orange-400 font-semibold">
                Test Reports
              </span>
              <h2 className="font-display mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
                Understand quality at a glance
              </h2>
              <p className="mt-4 text-slate-400 leading-relaxed">
                Every test run produces a structured report designed for quick triage —
                not raw logs. See your health score, drill into failures, and prioritise
                fixes by severity.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Health score from 0 to 100",
                  "Total tests · pass · fail breakdown",
                  "End-to-end runtime measurement",
                  "Issues ranked by severity",
                  "Per-page and per-file error context",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock report card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
              {/* Score */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.15em] text-slate-400">Health Score</span>
                <span className="text-4xl font-display font-bold text-orange-400">87</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700">
                <div className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: "87%" }} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total", value: "42", color: "text-slate-300" },
                  { label: "Passed", value: "37", color: "text-emerald-400" },
                  { label: "Failed", value: "5", color: "text-red-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-900/60 rounded-lg p-3 text-center">
                    <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Issues */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.15em] text-slate-400">Top Issues</span>
                {[
                  { sev: "HIGH", msg: "Login form submit has no response feedback" },
                  { sev: "MED", msg: "Mobile nav menu not keyboard-accessible" },
                  { sev: "LOW", msg: "Dashboard chart label overflows on resize" },
                ].map((issue) => (
                  <div key={issue.msg} className="flex items-start gap-3 bg-slate-900/60 rounded-lg px-3 py-2">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                        issue.sev === "HIGH"
                          ? "text-red-400"
                          : issue.sev === "MED"
                          ? "text-orange-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {issue.sev}
                    </span>
                    <span className="text-xs text-slate-400 leading-snug">{issue.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-orange-600 font-semibold">
            Get started
          </span>
          <h2 className="font-display mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Ready to automate your QA?
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Upload your source code or connect GitHub and get a full test report in minutes —
            no configuration, no writing tests by hand.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-7 py-3 rounded-lg transition-colors shadow-sm"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold px-7 py-3 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
