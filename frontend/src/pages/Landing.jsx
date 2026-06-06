import React, { useState } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import LogoStrip from "../components/landing/LogoStrip";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import NavHub from "../components/landing/NavHub";
import Footer from "../components/landing/Footer";
import HeroParticleNetwork from "../components/landing/HeroParticleNetwork";
import { AboutModal } from "../components/landing/AboutModal";

export default function Landing() {
  const [aboutOpen, setAboutOpen] = useState(false);

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
        <NavHub onAboutOpen={() => setAboutOpen(true)} />
        <Footer />
        <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      </div>
    </div>
  );
}
