import React from "react";
import {
  SiGithub,
  SiGitlab,
  SiJenkins,
  SiSlack,
  SiJira,
  SiVercel,
  SiCircleci,
  SiDatadog,
  SiLinear,
  SiBitbucket,
} from "react-icons/si";

const logos = [
  { Icon: SiGithub, name: "GitHub" },
  { Icon: SiGitlab, name: "GitLab" },
  { Icon: SiJenkins, name: "Jenkins" },
  { Icon: SiSlack, name: "Slack" },
  { Icon: SiJira, name: "Jira" },
  { Icon: SiVercel, name: "Vercel" },
  { Icon: SiCircleci, name: "CircleCI" },
  { Icon: SiDatadog, name: "Datadog" },
  { Icon: SiLinear, name: "Linear" },
  { Icon: SiBitbucket, name: "Bitbucket" },
];

export default function LogoStrip() {
  return (
    <section
      data-testid="logo-strip"
      className="py-14 md:py-16 border-b border-slate-200 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <p className="text-center text-xs font-mono uppercase tracking-[0.2em] text-slate-400 mb-8">
          Plugs into your stack
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex gap-14 animate-marquee w-max">
            {[...logos, ...logos].map((l, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors shrink-0"
                data-testid={`logo-${l.name.toLowerCase()}-${i}`}
              >
                <l.Icon className="h-7 w-7" />
                <span className="font-display font-semibold text-lg whitespace-nowrap">
                  {l.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
