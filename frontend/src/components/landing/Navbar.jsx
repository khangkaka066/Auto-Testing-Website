import React, { useState } from "react";
import { Menu, X, Plane } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      data-testid="site-navbar"
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-slate-200/70"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <a
          href="#"
          data-testid="brand-logo"
          className="flex items-center gap-2 font-display font-bold text-lg tracking-tight"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
            <Plane className="h-4 w-4 -rotate-45" />
          </span>
          TestPilot
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#"
            data-testid="nav-signin-link"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </a>
          <a
            href="#pricing"
            data-testid="nav-cta-button"
            className="text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md transition-colors"
          >
            Start free
          </a>
        </div>

        <button
          data-testid="mobile-menu-toggle"
          className="md:hidden p-2 -mr-2 text-slate-700"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div data-testid="mobile-menu" className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-slate-700"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#pricing"
              className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-md text-center"
            >
              Start free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
