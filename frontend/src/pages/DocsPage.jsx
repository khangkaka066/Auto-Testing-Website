import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  FileCode2,
  Github,
  LayoutDashboard,
  PlayCircle,
  Upload,
  Wand2,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";

const quickStarts = [
  {
    icon: Upload,
    title: "Upload a project",
    description:
      "Start with a ZIP file when you want the fastest setup. TestPilot extracts the source, indexes the app, and prepares it for automated analysis.",
  },
  {
    icon: Github,
    title: "Connect GitHub",
    description:
      "Choose a repository and branch through GitHub OAuth. TestPilot keeps project metadata in sync so every run uses the correct source.",
  },
  {
    icon: Wand2,
    title: "Generate tests with AI",
    description:
      "Describe a user flow in plain English. The AI author creates end-to-end scenarios that you can review before running.",
  },
];

const guides = [
  "Create your first automated test run",
  "Read pass, fail, and warning states in a report",
  "Debug selectors with screenshots and traces",
  "Manage project settings and account profile",
];

const apiExamples = [
  {
    method: "POST",
    endpoint: "/api/projects/upload",
    copy: "Upload a ZIP archive and create a project workspace.",
  },
  {
    method: "GET",
    endpoint: "/api/test-runs/:projectId",
    copy: "Fetch the latest status for a running or completed test job.",
  },
  {
    method: "GET",
    endpoint: "/api/reports/:projectId",
    copy: "Open the generated test report, including logs and summary metrics.",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_35%),radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%)]" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
              <BookOpen className="h-3.5 w-3.5" /> Documentation
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-950">
              Learn how to ship reliable tests with TestPilot.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600 leading-8">
              Find setup steps, product guides, testing workflows, and API notes for using TestPilot from your first project to production CI.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start a project <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#quick-start"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
              >
                Read quick start
              </a>
            </div>
          </div>
        </section>

        <section id="quick-start" className="max-w-7xl mx-auto px-6 md:px-8 py-16 text-left">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Quick start</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Get from source code to first report.</h2>
            <p className="mt-4 text-slate-600 leading-7">
              These are the core steps most documentation pages provide first: connect your app, configure the testing target, run tests, and inspect the generated result.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {quickStarts.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] text-left">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Guides</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Common workflows</h2>
              <p className="mt-4 text-slate-600 leading-7">
                Use these guides when you need practical instructions instead of marketing copy. Each topic maps to a common TestPilot user journey.
              </p>
            </div>
            <div className="grid gap-3">
              {guides.map((guide) => (
                <div key={guide} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-slate-700">{guide}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 text-left">
          <div className="grid gap-8 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <LayoutDashboard className="h-6 w-6 text-orange-600" />
              <h3 className="mt-4 text-xl font-semibold">Dashboard</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Track projects, recent test runs, account details, and navigation to report pages from one workspace.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <PlayCircle className="h-6 w-6 text-orange-600" />
              <h3 className="mt-4 text-xl font-semibold">Test runner</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Launch automated checks, watch progress, and move directly into a generated report when execution completes.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FileCode2 className="h-6 w-6 text-orange-600" />
              <h3 className="mt-4 text-xl font-semibold">Reports</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Review pass rates, failure logs, screenshots, and actionable notes so your team knows what to fix next.
              </p>
            </article>
          </div>
        </section>

        <section id="api-reference" className="bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 text-left">
            <div className="flex items-center gap-2 text-orange-300 text-sm font-semibold uppercase tracking-[0.18em]">
              <Code2 className="h-4 w-4" /> API reference
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Useful backend endpoints</h2>
            <p className="mt-4 max-w-2xl text-slate-300 leading-7">
              The app uses API routes for authentication, uploads, test execution, and reports. Keep tokens in the Authorization header when calling protected endpoints.
            </p>
            <div className="mt-8 grid gap-4">
              {apiExamples.map((item) => (
                <div key={item.endpoint} className="rounded-xl border border-white/10 bg-white/5 p-4 md:flex md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-orange-500/15 px-2 py-1 text-xs font-bold text-orange-200">{item.method}</span>
                      <code className="text-sm text-slate-100">{item.endpoint}</code>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
