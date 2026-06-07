import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, Users, Code2, ArrowRight, Github, Globe } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import HeroParticleNetwork from "../components/landing/HeroParticleNetwork";
import { useLanguage } from "../lib/i18n";

// ── Static data ───────────────────────────────────────────────────────────────

const TEAM = [
  { name: "Nguyễn Võ Hoàng Khang", role: "—" },
  { name: "Trần Văn Thuận",         role: "—" },
  { name: "Nguyễn Mạnh Hưng",       role: "—" },
  { name: "Lại Hoàng Minh Phúc",    role: "—" },
  { name: "Trương Công Nguyên",      role: "—" },
  { name: "Tô Trí Diện",            role: "—" },
];

const TECH_GROUPS = [
  {
    label: "Frontend",
    items: ["React 19", "Tailwind CSS", "Radix UI", "Framer Motion", "React Router v7"],
  },
  {
    label: "Backend",
    items: ["Node.js", "Express", "Supabase", "MongoDB", "PostgreSQL"],
  },
  {
    label: "AI & Testing",
    items: ["OpenAI API", "Playwright", "Resend"],
  },
  {
    label: "Auth & Cloud",
    items: ["Google OAuth", "GitHub OAuth", "Cloudflare R2", "Docker"],
  },
];

const MISSION_CARDS = [
  {
    title: "Accessible QA Automation",
    body: "We remove the technical barriers in software testing. Just upload your source code — the AI will analyze it, generate test cases, and run the tests automatically, no complex setup required.",
  },
  {
    title: "Catch Bugs Before Production",
    body: "Every deployment carries risk. TestPilot helps teams ship with confidence by automatically checking UI, APIs, performance, and security in a single unified pipeline.",
  },
];

const ABOUT_VI = {
  missionCards: [
    { title: "QA automation dễ tiếp cận", body: "Chúng tôi loại bỏ rào cản kỹ thuật trong kiểm thử phần mềm. Chỉ cần upload source code, AI sẽ phân tích, tạo test case và chạy test tự động, không cần setup phức tạp." },
    { title: "Bắt bug trước production", body: "Mỗi lần deploy đều có rủi ro. TestPilot giúp team ship tự tin bằng cách tự động kiểm tra UI, API, performance và security trong một pipeline thống nhất." },
  ],
  heroBadge: "Về TestPilot",
  titleA: "Chúng tôi tin QA tốt",
  titleB: "không nên phức tạp.",
  subtitle: "TestPilot được xây dựng để mọi team phát triển đều tiếp cận được automated QA, từ founder solo đến enterprise squad. Bắt bug trước production nên nhẹ nhàng, không phải một công việc toàn thời gian.",
  startFree: "Bắt đầu miễn phí",
  viewFeatures: "Xem tính năng",
  stats: [{ value: "8+", label: "Loại test" }, { value: "6", label: "Thành viên" }, { value: "AI", label: "Kiểm thử bằng AI" }],
  mission: "Sứ mệnh",
  missionSubtitle: "Sứ mệnh mà chúng tôi xây dựng xoay quanh",
  team: "Đội ngũ",
  teamSubtitle: "Những người đang xây dựng TestPilot",
  techStack: "Tech Stack",
  techSubtitle: "Công nghệ vận hành nền tảng",
  ready: "Sẵn sàng ship tự tin?",
  startToday: "Bắt đầu test hôm nay.",
  ctaBody: "Bắt đầu miễn phí, không cần thẻ. Upload source code và nhận báo cáo đầy đủ trong vài phút.",
  createAccount: "Tạo tài khoản miễn phí",
};

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardSpring = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.1 + i * 0.08,
      type: "spring",
      stiffness: 300,
      damping: 26,
    },
  }),
};

const badgePop = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.05 + i * 0.04,
      type: "spring",
      stiffness: 480,
      damping: 22,
    },
  }),
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name }) {
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hue = ((name.charCodeAt(0) * 37 + name.charCodeAt(1) * 13) % 360 + 360) % 360;
  return (
    <div
      className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg"
      style={{
        background: `linear-gradient(135deg, hsl(${hue},60%,55%), hsl(${(hue + 30) % 360},55%,48%))`,
      }}
    >
      {initials}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, label, subtitle }) {
  return (
    <div className="mb-10">
      <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5 mb-4">
        <Icon className="h-4 w-4 text-orange-500" />
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-orange-500">
          {label}
        </span>
      </div>
      {subtitle && (
        <p className="text-slate-500 text-base max-w-xl">{subtitle}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { language } = useLanguage();
  const copy = language === "vi" ? ABOUT_VI : null;
  const missionCards = copy?.missionCards || MISSION_CARDS;

  return (
    <div className="min-h-screen text-slate-900">
      <HeroParticleNetwork />

      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="relative overflow-hidden pt-24 pb-20 px-6">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.12) 0%, transparent 70%)",
              }}
            />

            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5 mb-6"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs font-mono font-semibold uppercase tracking-widest text-orange-500">
                  {copy?.heroBadge || "About TestPilot"}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.08] mb-6"
              >
                {copy?.titleA || "We believe great QA"}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">
                  {copy?.titleB || "shouldn't be complicated."}
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10"
              >
                {copy?.subtitle || "TestPilot is built to make automated QA accessible for every development team — from solo founders to enterprise squads. Catching bugs before production should be effortless, not a full-time job."}
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="flex flex-wrap items-center justify-center gap-3"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-md shadow-orange-500/25"
                >
                  {copy?.startFree || "Start for free"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                >
                  {copy?.viewFeatures || "View features"}
                </Link>
              </motion.div>
            </div>
          </section>

          {/* ── Divider stats ── */}
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-5xl mx-auto px-6 mb-24"
          >
            <div className="grid grid-cols-3 divide-x divide-slate-100 border border-slate-100 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
              {(copy?.stats || [
                { value: "8+", label: "Test types" },
                { value: "6",  label: "Team members" },
                { value: "AI", label: "Powered testing" },
              ]).map((s, i) => (
                <div key={i} className="flex flex-col items-center justify-center py-8 px-4">
                  <span className="text-3xl font-bold text-slate-900">{s.value}</span>
                  <span className="text-sm text-slate-500 mt-1 text-center">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── Mission ── */}
          <section className="max-w-5xl mx-auto px-6 mb-24">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <SectionHeading
                icon={Rocket}
                label={copy?.mission || "Mission"}
                subtitle={copy?.missionSubtitle || "The mission we're built around"}
              />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {missionCards.map((card, i) => (
                <motion.div
                  key={i}
                  variants={cardSpring}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-md hover:border-orange-100 transition-all"
                >
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                    <Rocket className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-base mb-2">{card.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{card.body}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Team ── */}
          <section className="max-w-5xl mx-auto px-6 mb-24">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <SectionHeading
                icon={Users}
                label={copy?.team || "Team"}
                subtitle={copy?.teamSubtitle || "The people building TestPilot"}
              />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEAM.map((member, i) => (
                <motion.div
                  key={member.name}
                  custom={i}
                  variants={cardSpring}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 16px 32px -8px rgba(249,115,22,0.16)",
                    borderColor: "#fdba74",
                  }}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm cursor-default transition-colors"
                  transition={{ type: "spring", stiffness: 360, damping: 26 }}
                >
                  <Avatar name={member.name} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{member.name}</p>
                    <p className="text-xs text-slate-400 mt-1 group-hover:text-orange-400 transition-colors">
                      {member.role}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Tech Stack ── */}
          <section className="max-w-5xl mx-auto px-6 mb-24">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <SectionHeading
                icon={Code2}
                label={copy?.techStack || "Tech Stack"}
                subtitle={copy?.techSubtitle || "Technologies powering the platform"}
              />
            </motion.div>

            <div className="space-y-6">
              {TECH_GROUPS.map((group, gi) => (
                <motion.div
                  key={group.label}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={gi}
                >
                  <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((tech, bi) => (
                      <motion.span
                        key={tech}
                        custom={gi * 6 + bi}
                        variants={badgePop}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        whileHover={{
                          scale: 1.08,
                          backgroundColor: "#fff7ed",
                          borderColor: "#fdba74",
                          color: "#c2410c",
                        }}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm cursor-default transition-colors"
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="max-w-5xl mx-auto px-6 mb-24">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: "radial-gradient(125% 125% at 50% 120%, #1e293b 30%, #f97316 200%)",
              }}
            >
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
              <div className="relative px-10 py-14 text-center text-white">
                <p className="text-xs font-mono uppercase tracking-widest text-orange-400 mb-4">
                  {copy?.ready || "Ready to ship with confidence?"}
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {copy?.startToday || "Start testing today."}
                </h2>
                <p className="text-slate-300 text-base mb-8 max-w-md mx-auto">
                  {copy?.ctaBody || "Free to get started — no credit card required. Upload your source code and get a full report in minutes."}
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/30"
                >
                  {copy?.createAccount || "Create a free account"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
