import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "motion/react";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { Users, Code2, Rocket } from "lucide-react";

const TEAM = [
  { name: "Nguyễn Võ Hoàng Khang", role: "—" },
  { name: "Nguyễn Mạnh Hưng",      role: "—" },
  { name: "Trần Văn Thuận",      role: "—" },
  { name: "Lại Hoàng Minh Phúc",   role: "—" },
  { name: "Trương Công Nguyên",     role: "—" },
  { name: "Tô Trí Diện",           role: "—" },
];

const TECH = [
  "React", "Tailwind CSS", "Radix UI",
  "Node.js", "Express", "MongoDB", "Supabase",
  "OpenAI API", "Playwright",
  "Google OAuth", "GitHub OAuth",
  "Cloudflare R2", "Resend",
];

const sectionIn = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  visible: (i) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

const cardIn = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: (i) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: 0.25 + i * 0.09, type: "spring", stiffness: 320, damping: 28 },
  }),
};

const badgeIn = {
  hidden: { opacity: 0, scale: 0.65 },
  visible: (i) => ({
    opacity: 1, scale: 1,
    transition: { delay: 0.35 + i * 0.045, type: "spring", stiffness: 500, damping: 24 },
  }),
};

function Avatar({ name }) {
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 13) % 360;
  return (
    <motion.div
      className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
      style={{
        background: `hsl(${hue},55%,52%)`,
        boxShadow: `0 0 0 3px white, 0 0 0 5px hsl(${hue},55%,72%)`,
      }}
      whileHover={{ scale: 1.12, rotate: 6 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
    >
      {initials}
    </motion.div>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-6 w-6 rounded-full bg-orange-500 shadow-md shadow-orange-500/40 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="text-xs font-mono uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}

export function AboutModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-2xl gap-0">

        {/* ── Header ── */}
        <div
          className="relative px-8 py-8 rounded-t-2xl overflow-hidden"
          style={{ background: "radial-gradient(125% 125% at 50% 120%, #fff 30%, #f97316 100%)" }}
        >
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-24 w-48 rounded-full bg-orange-300/10 blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <motion.img
              src="/logo.png"
              alt="TestPilot"
              className="h-10 w-10 rounded-xl shadow-lg shadow-orange-500/30"
              initial={{ opacity: 0, rotate: -12, scale: 0.75 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
            />
            <motion.span
              className="text-slate-500 font-semibold text-xs tracking-widest uppercase"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
            >
              TestPilot
            </motion.span>
          </div>

          <DialogHeader>
            <DialogTitle asChild>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                <VerticalCutReveal
                  splitBy="words"
                  staggerDuration={0.14}
                  staggerFrom="first"
                  transition={{ type: "spring", stiffness: 260, damping: 38, delay: 0.18 }}
                >
                  About Us
                </VerticalCutReveal>
              </h2>
            </DialogTitle>
          </DialogHeader>

          <motion.p
            className="mt-2 text-sm text-slate-500"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Building the future of automated QA
          </motion.p>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-7 space-y-8">

          {/* Mission */}
          <motion.section custom={0} variants={sectionIn} initial="hidden" animate="visible">
            <SectionLabel icon={Rocket} label="Mission" />
            <p className="text-slate-700 leading-relaxed text-[15px]">
              TestPilot is built to make automated QA accessible for every development team —
              from solo founders to enterprise squads. We believe catching bugs before production
              should be effortless, not a full-time job.
            </p>
          </motion.section>

          {/* Team */}
          <motion.section custom={1} variants={sectionIn} initial="hidden" animate="visible">
            <SectionLabel icon={Users} label="Team" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEAM.map((member, i) => (
                <motion.div
                  key={member.name}
                  custom={i}
                  variants={cardIn}
                  initial="hidden"
                  animate="visible"
                  whileHover={{
                    scale: 1.025,
                    y: -3,
                    boxShadow: "0 10px 28px -6px rgba(249,115,22,0.18)",
                    borderColor: "#fdba74",
                    backgroundColor: "#fff7ed",
                  }}
                  className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-default"
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                >
                  <Avatar name={member.name} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{member.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Tech Stack */}
          <motion.section custom={2} variants={sectionIn} initial="hidden" animate="visible">
            <SectionLabel icon={Code2} label="Tech Stack" />
            <div className="flex flex-wrap gap-2">
              {TECH.map((tech, i) => (
                <motion.span
                  key={tech}
                  custom={i}
                  variants={badgeIn}
                  initial="hidden"
                  animate="visible"
                  whileHover={{
                    scale: 1.1,
                    backgroundColor: "#fff7ed",
                    borderColor: "#fdba74",
                    boxShadow: "0 2px 8px rgba(249,115,22,0.18)",
                  }}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm cursor-default"
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AboutButton({ className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 group/link py-1 ${className}`}
      >
        About
        <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-orange-500 transition-all duration-300 group-hover/link:w-full" />
      </button>
      <AboutModal open={open} onOpenChange={setOpen} />
    </>
  );
}
