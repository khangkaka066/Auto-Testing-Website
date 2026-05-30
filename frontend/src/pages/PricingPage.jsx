import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PricingSection2 from "../components/ui/pricing-section-1";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top nav with back button */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <Link
            to="/"
            className="flex items-center gap-2 font-display font-bold text-lg tracking-tight text-slate-900"
          >
            <img src="/logo.png" alt="TestPilot" className="h-8 w-8 rounded-md" />
            TestPilot
          </Link>
        </div>
      </header>

      {/* New interactive pricing section */}
      <PricingSection2 />
    </div>
  );
}
