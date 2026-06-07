import React, { useRef } from "react";
import { SectionHeader } from "./Features";
import { Root, Animation } from "@bsmnt/scrollytelling";
import { useT } from "../../lib/i18n";

const IMGS = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwb2ZmaWNlfGVufDB8fHx8MTc3ODg2MDk4MXww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwb2ZmaWNlfGVufDB8fHx8MTc3ODg2MDk4MXww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwb2ZmaWNlfGVufDB8fHx8MTc3ODg2MDk4MXww&ixlib=rb-4.1.0&q=85",
];

export default function Testimonials() {
  const { testimonialsT: t } = useT("landing");

  const headerRef = useRef(null);
  const q1 = useRef(null), q2 = useRef(null), q3 = useRef(null);
  const statsRef = useRef(null);
  const cardRefs = [q1, q2, q3];

  return (
    <Root start="top 85%" end="top 10%" scrub={1}>
      <section id="testimonials" data-testid="testimonials-section" className="py-24 md:py-32 border-b border-slate-200">
        <Animation tween={{ target: headerRef, start: 0, end: 35, fromTo: [{ opacity: 0, y: 35 }, { opacity: 1, y: 0 }] }} />
        <Animation tween={cardRefs.map((ref, i) => ({
          target: ref, start: 10 + i * 15, end: 50 + i * 15,
          fromTo: [{ opacity: 0, y: 50 }, { opacity: 1, y: 0 }],
        }))} />
        <Animation tween={{ target: statsRef, start: 65, end: 90, fromTo: [{ opacity: 0, y: 30 }, { opacity: 1, y: 0 }] }} />

        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div ref={headerRef}>
            <SectionHeader label={t.header.label} title={t.header.title} />
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.items.map((item, i) => (
              <figure key={i} ref={cardRefs[i]} data-testid={`testimonial-${i}`}
                className="bg-white border border-slate-200 rounded-lg p-7 flex flex-col"
              >
                <span className="font-display text-5xl leading-none text-orange-400">"</span>
                <blockquote className="mt-3 text-slate-700 leading-relaxed">{item.quote}</blockquote>
                <figcaption className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
                  <img src={IMGS[i]} alt={item.name} className="h-11 w-11 rounded-full object-cover bg-slate-200" loading="lazy" />
                  <div>
                    <div className="font-display font-semibold text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-500">{item.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          <div ref={statsRef} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {t.stats.map((s) => (
              <div key={s.l} className="bg-white p-6 text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-slate-900">{s.v}</div>
                <div className="mt-1 text-xs font-mono uppercase tracking-[0.2em] text-slate-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Root>
  );
}
