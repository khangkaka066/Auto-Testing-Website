import React from "react";
import { Link } from "react-router-dom";
import { SiFacebook, SiTiktok } from "react-icons/si";
import { footerT } from "../../content/landing";

const ROUTE_MAP = {
  Features: "/features",
  "Tính năng": "/features",
  Pricing: "/pricing",
  "Bảng giá": "/pricing",
  Changelog: "/changelog",
  Docs: "/docs",
  "API reference": "/docs#api-reference",
  Roadmap: "/roadmap",
  Privacy: "/privacy-policy",
  "Bảo mật": "/privacy-policy",
  Terms: "/terms-of-service",
  "Điều khoản": "/terms-of-service",
};

export default function Footer() {
  const t = footerT;

  return (
    <footer className="bg-white/85 backdrop-blur-sm border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-12">

          <div className="col-span-2 md:col-span-2">
            <a href="#" className="flex items-center gap-2 font-bold text-lg text-slate-900">
              <img src="/logo.png" alt="TestPilot" className="h-8 w-8 rounded-md" />
              TestPilot
            </a>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-xs">{t.tagline}</p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.facebook.com/share/1Ai6P7uPZ4/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="social-link-facebook"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-[#1877F2] hover:border-[#1877F2] transition-colors"
                aria-label="Facebook"
              >
                <SiFacebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@userriea2dhf16?_r=1&_t=ZS-96s3dNKN64T"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="social-link-tiktok"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
                aria-label="TikTok"
              >
                <SiTiktok className="h-4 w-4" />
              </a>
            </div>
          </div>

          {t.cols.map((c) => (
            <div key={c.title} id={`nav-${c.title.toLowerCase()}`}>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400 font-semibold">{c.title}</div>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    {ROUTE_MAP[l] ? (
                      <Link to={ROUTE_MAP[l]} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">{l}</Link>
                    ) : (
                      <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">{l}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">{t.copyright}</p>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">{t.builtFor}</p>
        </div>
      </div>
    </footer>
  );
}
