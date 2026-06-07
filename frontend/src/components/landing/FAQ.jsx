import React, { useRef } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { SectionHeader } from "./Features";
import { Root, Animation } from "@bsmnt/scrollytelling";
import { useT } from "../../lib/i18n";

export default function FAQ() {
  const { faqT: t } = useT("landing");

  const headerRef = useRef(null);
  const f1 = useRef(null), f2 = useRef(null), f3 = useRef(null);
  const f4 = useRef(null), f5 = useRef(null), f6 = useRef(null);
  const faqRefs = [f1, f2, f3, f4, f5, f6];

  return (
    <Root start="top 85%" end="top 15%" scrub={1}>
      <section id="faq" data-testid="faq-section" className="py-24 md:py-32 border-b border-slate-200 bg-slate-50/40">
        <Animation tween={{ target: headerRef, start: 0, end: 38, fromTo: [{ opacity: 0, y: 30 }, { opacity: 1, y: 0 }] }} />
        <Animation tween={faqRefs.map((ref, i) => ({
          target: ref, start: 12 + i * 12, end: 50 + i * 10,
          fromTo: [{ opacity: 0, x: -24 }, { opacity: 1, x: 0 }],
        }))} />

        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div ref={headerRef}>
            <SectionHeader label={t.header.label} title={t.header.title} align="center" />
          </div>

          <Accordion type="single" collapsible className="mt-12 flex flex-col gap-3">
            {t.items.map((f, i) => (
              <div key={i} ref={faqRefs[i]}>
                <AccordionItem value={`item-${i}`} data-testid={`faq-item-${i}`}
                  className="border border-slate-200 rounded-lg bg-white px-5 [&[data-state=open]]:border-slate-300"
                >
                  <AccordionTrigger className="font-display text-left font-semibold text-slate-900 hover:no-underline py-5">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed pb-5">{f.a}</AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        </div>
      </section>
    </Root>
  );
}
