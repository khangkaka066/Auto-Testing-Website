import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { SectionHeader } from "./Features";

const faqs = [
  {
    q: "Do I need to write code to use TestPilot?",
    a: "No. You can describe flows in plain English and TestPilot generates and maintains the tests for you. Power users can still write or import Playwright / Cypress specs.",
  },
  {
    q: "Which browsers and devices are supported?",
    a: "Chrome, Firefox, Safari and Edge on desktop, plus iOS Safari and Android Chrome viewports. Tests run in parallel across all of them.",
  },
  {
    q: "How does self-healing work?",
    a: "When a selector drifts (for example, a class name changes), TestPilot uses heuristics and a vision model to relocate the element and proposes a fix. You can auto-merge or review.",
  },
  {
    q: "Can I run TestPilot in my own CI?",
    a: "Yes. Drop-in GitHub Actions, GitLab CI and CircleCI integrations are available. You can also trigger runs via our REST API or CLI.",
  },
  {
    q: "Is my data secure?",
    a: "All runners are isolated, secrets are encrypted at rest, and access is role-based. We are SOC 2 Type II certified and GDPR compliant.",
  },
  {
    q: "What happens after the free trial?",
    a: "You roll over to the Free plan automatically — no cards charged. Upgrade to Pro any time to unlock more runs and features.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      data-testid="faq-section"
      className="py-24 md:py-32 border-b border-slate-200 bg-slate-50/40"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <SectionHeader
          label="FAQ"
          title="Questions, answered."
          align="center"
        />
        <Accordion type="single" collapsible className="mt-12 space-y-3" data-testid="faq-accordion">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              data-testid={`faq-item-${i}`}
              className="border border-slate-200 rounded-lg bg-white px-5 [&[data-state=open]]:border-slate-300"
            >
              <AccordionTrigger className="font-display text-left font-semibold text-slate-900 hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
