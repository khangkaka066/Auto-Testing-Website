import React from "react";
import { Sparkles, Globe, Eye, GitBranch, Zap, ShieldCheck } from "lucide-react";

export default function Features() {
  return (
    <section
      id="features"
      data-testid="features-section"
      className="py-24 md:py-32 border-b border-slate-200 bg-slate-50/40"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <SectionHeader
          label="Capabilities"
          title="Everything you need to ship confidently."
          subtitle="From AI-generated test cases to pixel-perfect visual diffs, TestPilot covers every layer of quality assurance."
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-6 gap-5">
          {/* Big card - AI authoring */}
          <FeatureCard
            className="md:col-span-3 md:row-span-2"
            testid="feature-ai-authoring"
            icon={<Sparkles className="h-5 w-5" />}
            title="AI-authored E2E tests"
            description="Describe a flow in plain English. TestPilot writes, runs, and self-heals tests as your UI evolves."
          >
            <div className="mt-6 rounded-md bg-slate-900 border border-slate-800 p-5 text-sm font-mono shadow-xl">
              <div className="text-slate-500">// Generated from prompt</div>
              <div className="text-slate-300 mt-1">
                <span className="text-orange-400">test</span>(
                <span className="text-emerald-300">'user can complete checkout'</span>,
                async () =&gt; {"{"}
              </div>
              <div className="text-slate-300 pl-4">
                await page.goto(<span className="text-emerald-300">'/cart'</span>);
              </div>
              <div className="text-slate-300 pl-4">
                await page.click(<span className="text-emerald-300">'[data-testid=checkout]'</span>);
              </div>
              <div className="text-slate-300 pl-4">
                await expect(orderConfirm).<span className="text-orange-400">toBeVisible</span>();
              </div>
              <div className="text-slate-300">{"}"});</div>
            </div>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-3"
            testid="feature-visual"
            icon={<Eye className="h-5 w-5" />}
            title="Visual regression"
            description="Catch one-pixel shifts. Side-by-side diffs across breakpoints with smart ignore regions."
          />

          <FeatureCard
            className="md:col-span-3"
            testid="feature-cross-browser"
            icon={<Globe className="h-5 w-5" />}
            title="Cross-browser at scale"
            description="Parallel runs across Chrome, Firefox, Safari, and Edge — desktop and mobile viewports."
          />

          <FeatureCard
            className="md:col-span-2"
            testid="feature-cicd"
            icon={<GitBranch className="h-5 w-5" />}
            title="CI/CD native"
            description="Drop-in actions for GitHub, GitLab and CircleCI. Block PRs that break the build."
          />

          <FeatureCard
            className="md:col-span-2"
            testid="feature-speed"
            icon={<Zap className="h-5 w-5" />}
            title="10× faster runs"
            description="Smart parallelization and test sharding. Full suite in under a minute."
          />

          <FeatureCard
            className="md:col-span-2"
            testid="feature-security"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="SOC 2 secure"
            description="Encrypted secrets, isolated runners, role-based access. Enterprise-ready out of the box."
          />
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({ label, title, subtitle, align = "left" }) {
  return (
    <div className={align === "center" ? "max-w-3xl mx-auto text-center" : "max-w-3xl"}>
      <div className="text-xs font-mono uppercase tracking-[0.2em] text-orange-600 font-semibold">
        {label}
      </div>
      <h2 className="font-display mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{subtitle}</p>
      )}
    </div>
  );
}

function FeatureCard({ className = "", testid, icon, title, description, children }) {
  return (
    <div
      data-testid={testid}
      className={`group bg-white border border-slate-200 rounded-lg p-7 hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${className}`}
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600 border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="font-display mt-5 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}
