import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
  LayoutTemplate,
  Rocket,
  Sparkles,
  CreditCard,
  TestTube2,
  Upload,
  Github,
  Users,
  Bell,
  GitPullRequest,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import HeroParticleNetwork from "../components/landing/HeroParticleNetwork";

const QUARTERS = [
  {
    quarter: "Q1 2026",
    status: "Completed",
    title: "Planning and beta version",
    description:
      "Define the product direction, validate the core QA workflow, and release a beta version for early testing.",
    accent: "bg-slate-900 text-white",
    icon: CalendarDays,
    items: [
      { icon: CheckCircle2, label: "Product scope and technical plan" },
      { icon: Upload, label: "Initial source upload workflow" },
      { icon: FlaskConical, label: "Beta version for controlled testing" },
    ],
  },
  {
    quarter: "Q2 2026",
    status: "In progress",
    title: "UI/UX refresh, test expansion, billing, and alpha version",
    description:
      "Improve the user experience, add more testing coverage, integrate payments, and prepare the alpha release.",
    accent: "bg-orange-500 text-white",
    icon: LayoutTemplate,
    items: [
      { icon: LayoutTemplate, label: "Redesigned UI/UX across landing and workspace" },
      { icon: TestTube2, label: "More test types for UI, API, and functional flows" },
      { icon: CreditCard, label: "Payment and credit billing integration" },
      { icon: Sparkles, label: "Alpha version for broader product validation" },
    ],
  },
  {
    quarter: "Q3 2026",
    status: "Planned",
    title: "Official version",
    description:
      "Launch the official version for real users with a stable onboarding, billing, testing, and reporting experience.",
    accent: "bg-emerald-500 text-white",
    icon: Rocket,
    items: [
      { icon: Rocket, label: "Public launch for end users" },
      { icon: Github, label: "Stable GitHub repository workflow" },
      { icon: CheckCircle2, label: "Production-ready test reports and dashboard" },
    ],
  },
  {
    quarter: "Q4 2026",
    status: "Exploring",
    title: "Scale, collaboration, and workflow automation",
    description:
      "A flexible planning window for team workflows and deeper automation after the official launch.",
    accent: "bg-violet-500 text-white",
    icon: Users,
    items: [
      { icon: Users, label: "Team workspace and role permissions" },
      { icon: GitPullRequest, label: "CI/CD and pull request test triggers" },
      { icon: Bell, label: "Email or chat notifications for completed runs" },
    ],
  },
];

function QuarterCard({ quarter, index }) {
  const Icon = quarter.icon;

  return (
    <article className="relative rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute -left-[29px] top-8 hidden h-4 w-4 rounded-full border-4 border-white bg-orange-500 shadow-md shadow-orange-200 lg:block" />
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${quarter.accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500">
          {quarter.status}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-orange-600">
          {quarter.quarter}
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-900">
          {quarter.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {quarter.description}
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {quarter.items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <li key={item.label} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500 ring-1 ring-orange-100">
                <ItemIcon className="h-3.5 w-3.5" />
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>

      <span className="absolute bottom-5 right-6 select-none font-display text-6xl font-bold text-slate-100">
        {String(index + 1).padStart(2, "0")}
      </span>
    </article>
  );
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <HeroParticleNetwork />

      <div className="relative flex min-h-screen flex-col" style={{ zIndex: 1 }}>
        <Navbar />

        <main>
          <section className="relative overflow-hidden border-b border-slate-200 pt-24 pb-16 md:pt-32 md:pb-24">
            <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/65 via-white/45 to-white pointer-events-none" />

            <div className="relative mx-auto max-w-7xl px-6 md:px-8">
              <div className="grid items-center gap-12 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div
                    className="hero-fade-in inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-3 py-1 backdrop-blur"
                    style={{ animationDelay: "0ms" }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
                    </span>
                    <span className="text-xs font-mono font-semibold uppercase tracking-[0.18em] text-orange-700">
                      2026 Product Roadmap
                    </span>
                  </div>

                  <h1
                    className="hero-fade-in mt-6 font-display text-4xl font-bold leading-[1.03] tracking-tight text-slate-900 sm:text-5xl lg:text-7xl"
                    style={{ animationDelay: "140ms" }}
                  >
                    Building TestPilot from{" "}
                    <span className="relative inline-block">
                      <span className="relative z-10 text-orange-500">beta to launch</span>
                      <span className="absolute -bottom-1 left-0 right-0 h-3 bg-orange-200/70 -z-0"></span>
                    </span>
                  </h1>

                  <p
                    className="hero-fade-in mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
                    style={{ animationDelay: "260ms" }}
                  >
                    A quarter-by-quarter view of how TestPilot evolves through planning,
                    UI/UX improvements, expanded testing, payments, and the official release.
                  </p>

                  <div
                    className="hero-fade-in mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
                    style={{ animationDelay: "370ms" }}
                  >
                    <Link
                      to="/features"
                      className="group inline-flex items-center gap-2 rounded-md bg-orange-500 px-6 py-3.5 font-medium text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md"
                    >
                      View Features
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      to="/changelog"
                      className="inline-flex items-center gap-2 px-2 py-3.5 font-medium text-slate-700 hover:text-slate-900"
                    >
                      See Changelog
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="relative">
                    <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-orange-100 via-white to-slate-100 opacity-70 blur-2xl" />
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/5 backdrop-blur animate-float">
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400"></span>
                        <span className="h-2.5 w-2.5 rounded-full bg-green-400"></span>
                        <div className="ml-3 flex-1 rounded border border-slate-200 bg-white px-3 py-1 text-xs font-mono text-slate-500">
                          testpilot.app/roadmap
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">
                          Release timeline
                        </div>
                        <div className="mt-1 font-display font-semibold text-slate-900">
                          2026 execution plan
                        </div>

                        <div className="mt-5 space-y-3">
                          {QUARTERS.map((item) => (
                            <div key={item.quarter} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{item.quarter}</p>
                                <p className="truncate text-xs text-slate-500">{item.title}</p>
                              </div>
                              <span className="hidden shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-orange-600 ring-1 ring-orange-100 sm:inline-flex">
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative bg-slate-50/70 py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
              <div className="mx-auto mb-14 max-w-2xl text-center">
                <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-orange-600">
                  Quarterly milestones
                </span>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  What ships in each quarter
                </h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  The plan keeps Q4 flexible while still giving users a clear direction for
                  collaboration and automation after launch.
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-orange-200 via-orange-300 to-transparent lg:left-1/2 lg:block" />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {QUARTERS.map((quarter, index) => (
                    <div key={quarter.quarter} className={index % 2 === 0 ? "lg:pr-10" : "lg:pl-10 lg:translate-y-16"}>
                      <QuarterCard quarter={quarter} index={index} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 py-20 md:py-24">
            <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
              <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-orange-600">
                Product direction
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Start with the current workflow, grow into automation
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                TestPilot begins with source upload, repository connection, AI-generated tests,
                and clear reports. After launch, the roadmap moves toward team workflows,
                CI/CD triggers, and notifications.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/docs"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300"
                >
                  Read Docs
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
