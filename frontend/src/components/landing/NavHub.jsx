import React from "react";
import { Link } from "react-router-dom";
import {
  Zap, Info, Briefcase, BookOpen, Shield,
  DollarSign, GitCommit, Map, Users, Mail,
  FileText, Globe, HelpCircle, Rss, MessageSquare,
  Lock, FileCheck, Cookie, Server,
} from "lucide-react";

const SECTIONS = [
  {
    id: "nav-product",
    title: "Product",
    color: "orange",
    description: "TestPilot's core features",
    items: [
      { label: "Features", href: "#features", icon: Zap, description: "AI-powered test authoring & visual regression" },
      { label: "How it works", href: "#how", icon: GitCommit, description: "4 steps from zero to green builds" },
      { label: "Pricing", href: "/pricing", isLink: true, icon: DollarSign, description: "Simple, usage-based plans" },
      { label: "Changelog", href: "/changelog", isLink: true, icon: GitCommit, description: "Latest updates and releases" },
      { label: "Roadmap", href: "/roadmap", isLink: true, icon: Map, description: "What we're building next" },
    ],
  },
  {
    id: "nav-company",
    title: "Company",
    color: "blue",
    description: "Learn about us, our team and our mission.",
    items: [
      { label: "About", href: "#about-modal", isAbout: true, icon: Info, description: "Our story and mission" },
      { label: "Customers", href: "#testimonials", icon: Users, description: "Teams that trust TestPilot" },
      { label: "Careers", href: "#", icon: Briefcase, description: "Join our growing team" },
      { label: "Press kit", href: "#", icon: FileText, description: "Brand assets and media" },
      { label: "Contact", href: "#", icon: Mail, description: "Get in touch with us" },
    ],
  },
  {
    id: "nav-resources",
    title: "Resources",
    color: "green",
    description: "Everything you need to get started and go deeper.",
    items: [
      { label: "Docs", href: "/docs", isLink: true, icon: BookOpen, description: "Guides, tutorials and API reference" },
      { label: "Blog", href: "#", icon: Rss, description: "Engineering insights and updates" },
      { label: "Community", href: "#", icon: MessageSquare, description: "Join the TestPilot community" },
      { label: "FAQ", href: "#faq", icon: HelpCircle, description: "Common questions answered" },
      { label: "Status", href: "#", icon: Globe, description: "System status and uptime" },
    ],
  },
  {
    id: "nav-legal",
    title: "Legal",
    color: "slate",
    description: "Our commitments to privacy, security and compliance.",
    items: [
      { label: "Privacy Policy", href: "/privacy-policy", isLink: true, icon: Lock, description: "How we collect and use your data" },
      { label: "Terms of Service", href: "/terms-of-service", isLink: true, icon: FileCheck, description: "Usage terms and conditions" },
      { label: "Cookie Policy", href: "/cookie-policy", isLink: true, icon: Cookie, description: "Cookie usage and preferences" },
      { label: "Security", href: "#", icon: Shield, description: "SOC 2 Type II & data protection" },
      { label: "DPA", href: "#", icon: Server, description: "Data Processing Agreement" },
    ],
  },
];

const COLOR_MAP = {
  orange: {
    badge: "bg-orange-100 text-orange-600",
    icon: "bg-orange-50 text-orange-500 group-hover/item:bg-orange-100",
    title: "text-orange-600",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  blue: {
    badge: "bg-blue-100 text-blue-600",
    icon: "bg-blue-50 text-blue-500 group-hover/item:bg-blue-100",
    title: "text-blue-600",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  green: {
    badge: "bg-emerald-100 text-emerald-600",
    icon: "bg-emerald-50 text-emerald-500 group-hover/item:bg-emerald-100",
    title: "text-emerald-600",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  slate: {
    badge: "bg-slate-100 text-slate-600",
    icon: "bg-slate-100 text-slate-500 group-hover/item:bg-slate-200",
    title: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
  },
};

export default function NavHub({ onAboutOpen }) {
  return (
    <section id="site-nav" className="bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-20">

        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold text-slate-900">Explore TestPilot</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {SECTIONS.map((section) => {
            const c = COLOR_MAP[section.color];
            return (
              <div
                key={section.id}
                id={section.id}
                className={`bg-white rounded-2xl border ${c.border} p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={`text-xs font-mono uppercase tracking-widest font-bold ${c.title}`}>
                    {section.title}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 mb-5 leading-relaxed">
                  {section.description}
                </p>

                <ul className="flex flex-col gap-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const inner = (
                      <div className="group/item flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors duration-150 cursor-pointer">
                        <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${c.icon}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 group-hover/item:text-slate-900 leading-tight">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 leading-tight truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );

                    if (item.isAbout) {
                      return (
                        <li key={item.label}>
                          <button className="w-full text-left" onClick={() => onAboutOpen?.()}>
                            {inner}
                          </button>
                        </li>
                      );
                    }
                    if (item.isLink) {
                      return (
                        <li key={item.label}>
                          <Link to={item.href}>{inner}</Link>
                        </li>
                      );
                    }
                    return (
                      <li key={item.label}>
                        <a href={item.href}>{inner}</a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
