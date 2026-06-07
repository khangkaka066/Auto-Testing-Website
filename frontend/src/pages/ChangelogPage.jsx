import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";
import { motion } from "motion/react";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { TimelineContent } from "@/components/ui/timeline-animation";
import changelog from "../data/changelog.json";
import { useLanguage } from "../lib/i18n";

const TAG = {
  feature:     { label: "New",      bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-600",  dot: "bg-orange-500" },
  fix:         { label: "Fix",      bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-600",    dot: "bg-blue-500"   },
  breaking:    { label: "Breaking", bg: "bg-red-50",     border: "border-red-200",    text: "text-red-600",     dot: "bg-red-500"    },
  improvement: { label: "Improve",  bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-600",  dot: "bg-violet-500" },
};

const TAG_LABELS_VI = {
  feature: "Mới",
  fix: "Sửa lỗi",
  breaking: "Breaking",
  improvement: "Cải tiến",
};

const CHANGE_TEXT_VI = {
  "Added About modal with team info and tech stack": "Thêm About modal với thông tin team và tech stack",
  "Built Changelog public page with timeline layout": "Xây dựng trang Changelog public với layout timeline",
  "Upgraded About modal animations to match Pricing page style": "Nâng cấp animation của About modal để đồng bộ với style trang Pricing",
  "Fixed Google OAuth authorization error on localhost": "Sửa lỗi uỷ quyền Google OAuth trên localhost",
  "Internationalization: migrated language context to content files": "Internationalization: chuyển language context sang các file content",
  "Added billing, dashboard, landing, profile, testing content files": "Thêm content files cho billing, dashboard, landing, profile và testing",
  "Updated dependencies in useEffect hooks across multiple components": "Cập nhật dependencies trong useEffect hooks ở nhiều component",
  "AI-powered test authoring from plain English prompts": "AI tạo test từ prompt ngôn ngữ tự nhiên",
  "Cross-browser parallel test execution (Chrome, Firefox, Safari)": "Chạy test song song nhiều trình duyệt (Chrome, Firefox, Safari)",
  "10x faster test runs with smart parallelization": "Chạy test nhanh hơn 10 lần nhờ song song hoá thông minh",
  "Renamed runTest to executeTest in the public API": "Đổi tên runTest thành executeTest trong public API",
  "Visual regression diffs with side-by-side comparison": "Visual regression diff với so sánh song song",
  "GitHub, GitLab and CircleCI CI/CD integrations": "Tích hợp CI/CD với GitHub, GitLab và CircleCI",
  "Fixed flaky test detection in Firefox viewport": "Sửa phát hiện flaky test trong viewport Firefox",
  "Resolved token expiry issue on long-running sessions": "Sửa lỗi token hết hạn trong session chạy lâu",
  "Migrated from REST polling to WebSocket for live test progress": "Chuyển từ REST polling sang WebSocket cho tiến trình test realtime",
  "Self-healing selectors powered by vision model": "Selector tự phục hồi nhờ vision model",
  "New dashboard with real-time run statistics": "Dashboard mới với thống kê lượt chạy realtime",
  "Redesigned onboarding flow — setup in under 60 seconds": "Thiết kế lại onboarding, setup trong chưa tới 60 giây",
};

function Tag({ type, language }) {
  const t = TAG[type] || TAG.improvement;
  const label = language === "vi" ? TAG_LABELS_VI[type] || t.label : t.label;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${t.bg} ${t.border} ${t.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {label}
    </span>
  );
}

function formatDate(dateStr, language) {
  return new Date(dateStr).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

const cardVariants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  visible: (i) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.12, type: "spring", stiffness: 300, damping: 28 },
  }),
};

const changeVariants = {
  hidden: { opacity: 0, x: -16, filter: "blur(4px)" },
  visible: (i) => ({
    opacity: 1, x: 0, filter: "blur(0px)",
    transition: { delay: i * 0.07, duration: 0.38 },
  }),
};

export default function ChangelogPage() {
  const pageRef = useRef(null);
  const { language, setLanguage } = useLanguage();
  const vi = language === "vi";

  return (
    <div className="min-h-screen bg-white text-slate-900" ref={pageRef}>

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {vi ? "Quay lại" : "Back"}
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
            <img src="/logo.png" alt="TestPilot" className="h-7 w-7 rounded-md" />
            TestPilot
          </Link>
          <div className="ml-auto flex items-center rounded-md border border-slate-200 bg-white p-0.5">
            {["en", "vi"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  language === lang ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero header ── */}
      <div
        className="relative overflow-hidden px-6 pt-16 pb-20"
        style={{ background: "radial-gradient(125% 125% at 50% 120%, #fff 30%, #f97316 100%)" }}
      >
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-orange-400/15 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Zap className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-medium text-orange-600">{vi ? "Có gì mới" : "What's new"}</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.14}
              staggerFrom="first"
              containerClassName="justify-center"
              transition={{ type: "spring", stiffness: 260, damping: 38, delay: 0.2 }}
            >
              {vi ? "Nhật ký thay đổi" : "Changelog"}
            </VerticalCutReveal>
          </h1>

          <motion.p
            className="text-slate-500 text-base max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {vi ? "Mọi bản phát hành, sửa lỗi và cải tiến đều được team ghi lại." : "Every release, fix, and improvement — documented by the team."}
          </motion.p>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />

          <div className="space-y-12">
            {changelog.map((entry, i) => {
              const isLatest = i === 0;
              return (
                <motion.div
                  key={entry.version}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative pl-8"
                >
                  {/* Timeline dot */}
                  <motion.div
                    className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 ${
                      isLatest
                        ? "bg-orange-500 border-orange-500 shadow-md shadow-orange-500/40"
                        : "bg-white border-slate-300"
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.12 + 0.1, type: "spring", stiffness: 400 }}
                  />

                  {/* Card */}
                  <motion.div
                    whileHover={{
                      y: -2,
                      boxShadow: isLatest
                        ? "0 12px 32px -6px rgba(249,115,22,0.2)"
                        : "0 8px 24px -6px rgba(0,0,0,0.08)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    className={`rounded-2xl border p-6 ${
                      isLatest
                        ? "border-orange-300 bg-orange-50/40 shadow-sm shadow-orange-100"
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <span className={`font-mono text-lg font-bold ${isLatest ? "text-orange-600" : "text-slate-800"}`}>
                        v{entry.version}
                      </span>
                      {isLatest && (
                        <span className="inline-flex items-center rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow shadow-orange-500/30">
                          {vi ? "Mới nhất" : "Latest"}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-slate-400 tabular-nums">
                        {formatDate(entry.date, language)}
                      </span>
                    </div>

                    {/* Changes list */}
                    <ul className="space-y-2.5">
                      {entry.changes.map((change, j) => (
                        <motion.li
                          key={j}
                          custom={j}
                          variants={changeVariants}
                          initial="hidden"
                          animate="visible"
                          className="flex items-start gap-3"
                        >
                          <Tag type={change.type} language={language} />
                          <span className="text-sm text-slate-700 leading-relaxed pt-0.5">
                            {vi ? CHANGE_TEXT_VI[change.text] || change.text : change.text}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <p className="text-xs text-slate-400">
          {vi ? "Để thêm release, hãy chỉnh sửa " : "To add a release — edit "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-500">
            frontend/src/data/changelog.json
          </code>{" "}
          {vi ? " và commit cùng PR của bạn." : " and commit with your PR."}
        </p>
      </div>
    </div>
  );
}
