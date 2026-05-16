import React from "react";
import { SectionHeader } from "./Features";

const items = [
  {
    quote:
      "We cut release cycles from two weeks to two days. TestPilot's self-healing tests just don't break anymore — even on a UI overhaul.",
    name: "Maya Patel",
    role: "QA Lead, Northwind",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwb2ZmaWNlfGVufDB8fHx8MTc3ODg2MDk4MXww&ixlib=rb-4.1.0&q=85",
  },
  {
    quote:
      "Our staging caught three checkout regressions in the first week. The AI authoring saves my engineers half a day each sprint.",
    name: "Daniel Kim",
    role: "Head of Engineering, Loop",
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwb2ZmaWNlfGVufDB8fHx8MTc3ODg2MDk4MXww&ixlib=rb-4.1.0&q=85",
  },
  {
    quote:
      "Visual diffs across 12 viewports in 40 seconds. We replaced two paid tools with TestPilot and never looked back.",
    name: "Sofia Lange",
    role: "Frontend Director, Klear",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwb2ZmaWNlfGVufDB8fHx8MTc3ODg2MDk4MXww&ixlib=rb-4.1.0&q=85",
  },
];

const stats = [
  { v: "98.6%", l: "Less flake" },
  { v: "10×", l: "Faster runs" },
  { v: "4,200+", l: "Teams shipping" },
  { v: "SOC 2", l: "Type II" },
];

export default function Testimonials() {
  return (
    <section
      data-testid="testimonials-section"
      className="py-24 md:py-32 border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <SectionHeader
          label="Trusted by builders"
          title="Teams that hate broken builds, love TestPilot."
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <figure
              key={i}
              data-testid={`testimonial-${i}`}
              className="bg-white border border-slate-200 rounded-lg p-7 flex flex-col"
            >
              <span className="font-display text-5xl leading-none text-orange-400">"</span>
              <blockquote className="mt-3 text-slate-700 leading-relaxed">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
                <img
                  src={t.img}
                  alt={t.name}
                  className="h-11 w-11 rounded-full object-cover bg-slate-200"
                  loading="lazy"
                />
                <div>
                  <div className="font-display font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
          {stats.map((s) => (
            <div key={s.l} className="bg-white p-6 text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-slate-900">
                {s.v}
              </div>
              <div className="mt-1 text-xs font-mono uppercase tracking-[0.2em] text-slate-500">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
