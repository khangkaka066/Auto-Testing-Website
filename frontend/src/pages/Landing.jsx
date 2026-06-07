import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import LogoStrip from "../components/landing/LogoStrip";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import HeroParticleNetwork from "../components/landing/HeroParticleNetwork";

export default function Landing() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const targetId = hash.replace("#", "");
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <div data-testid="landing-page" className="min-h-screen text-slate-900">
      <HeroParticleNetwork />
      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />
        <main>
          <Hero />
          <LogoStrip />
          <Features />
          <HowItWorks />
          <Testimonials />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
