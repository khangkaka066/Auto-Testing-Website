import React from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import LogoStrip from "../components/landing/LogoStrip";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Pricing from "../components/landing/Pricing";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div data-testid="landing-page" className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <LogoStrip />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
