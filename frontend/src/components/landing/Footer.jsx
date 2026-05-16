import React from "react";
import { Plane, Twitter, Github, Linkedin } from "lucide-react";

const cols = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog", "Roadmap"],
  },
  {
    title: "Company",
    links: ["About", "Customers", "Careers", "Press kit", "Contact"],
  },
  {
    title: "Resources",
    links: ["Docs", "API reference", "Blog", "Community", "Status"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "SOC 2", "DPA"],
  },
];

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2 md:col-span-2">
            <a href="#" className="flex items-center gap-2 font-display font-bold text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
                <Plane className="h-4 w-4 -rotate-45" />
              </span>
              TestPilot
            </a>
            <p className="mt-4 text-sm text-slate-600 max-w-xs leading-relaxed">
              The autonomous QA platform for teams that ship every day.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  data-testid={`social-link-${i}`}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
                  aria-label="social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 font-semibold">
                {c.title}
              </div>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} TestPilot, Inc. All rights reserved.
          </p>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">
            Built for builders ·  v2.4.0
          </p>
        </div>
      </div>
    </footer>
  );
}
