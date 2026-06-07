import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  LockKeyhole,
  Newspaper,
  Rocket,
  Search,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { useLanguage } from "../lib/i18n";

const content = {
  en: {
    badge: "TestPilot Blog",
    title: "Insights, guides, and updates about AI-powered testing.",
    subtitle:
      "Learn how modern teams use AI to generate tests faster, understand reports, improve testability, and protect source code while building reliable software.",
    searchPlaceholder: "Search articles",
    featuredLabel: "Featured article",
    readArticle: "Read article",
    comingSoon: "Coming soon",
    categories: ["All", "AI Testing", "Product Guides", "Best Practices", "Security", "Updates"],
    featured: {
      category: "AI Testing",
      title: "What is AI-powered testing?",
      description:
        "A practical introduction to how AI can analyze web applications, generate useful test scenarios, and help teams catch regressions earlier.",
      date: "Jun 7, 2026",
      readTime: "5 min read",
    },
    articles: [
      {
        icon: Sparkles,
        category: "AI Testing",
        title: "What is AI-powered testing?",
        description:
          "Learn the basics of AI-assisted QA and where it fits in a modern testing workflow.",
        date: "Jun 7, 2026",
        readTime: "5 min read",
      },
      {
        icon: CheckCircle2,
        category: "Product Guides",
        title: "How to prepare your project before uploading",
        description:
          "A safe checklist for creating a clean ZIP file without secrets, large folders, or unnecessary build artifacts.",
        date: "Jun 7, 2026",
        readTime: "4 min read",
      },
      {
        icon: BookOpen,
        category: "Product Guides",
        title: "Understanding AI-generated test reports",
        description:
          "How to interpret health score, passed tests, failed tests, issues, screenshots, and recommendations.",
        date: "Jun 7, 2026",
        readTime: "6 min read",
      },
      {
        icon: Lightbulb,
        category: "Best Practices",
        title: "UI Testing vs Functional Testing",
        description:
          "Understand which testing mode to choose when validating screens, forms, navigation, or complete user journeys.",
        date: "Jun 7, 2026",
        readTime: "4 min read",
      },
      {
        icon: Newspaper,
        category: "Best Practices",
        title: "5 common testing mistakes in modern web apps",
        description:
          "Avoid brittle selectors, unclear flows, missing test data, and other issues that make automated tests unreliable.",
        date: "Jun 7, 2026",
        readTime: "7 min read",
      },
      {
        icon: LockKeyhole,
        category: "Security",
        title: "Keeping your source code safe when using AI tools",
        description:
          "Best practices for removing credentials, .env files, private keys, and customer data before using AI-powered tools.",
        date: "Jun 7, 2026",
        readTime: "5 min read",
      },
      {
        icon: Rocket,
        category: "Updates",
        title: "New: Docs and Community are now available",
        description:
          "A quick look at new resources that help teams learn TestPilot, share feedback, and improve testing workflows.",
        date: "Jun 7, 2026",
        readTime: "3 min read",
      },
    ],
    newsletterTitle: "Stay close to better testing workflows.",
    newsletterText:
      "Follow product education, practical QA guides, and TestPilot updates as the platform grows.",
    newsletterCta: "Start testing",
    docsCta: "Read docs",
  },
  vi: {
    badge: "Blog TestPilot",
    title: "Kiến thức, hướng dẫn và cập nhật về kiểm thử tự động bằng AI.",
    subtitle:
      "Tìm hiểu cách các team hiện đại dùng AI để tạo test nhanh hơn, đọc report hiệu quả hơn, cải thiện khả năng test và bảo vệ source code khi xây dựng phần mềm ổn định.",
    searchPlaceholder: "Tìm bài viết",
    featuredLabel: "Bài viết nổi bật",
    readArticle: "Đọc bài viết",
    comingSoon: "Sắp ra mắt",
    categories: ["Tất cả", "AI Testing", "Hướng dẫn", "Best Practices", "Bảo mật", "Cập nhật"],
    featured: {
      category: "AI Testing",
      title: "AI-powered testing là gì?",
      description:
        "Giới thiệu thực tế về cách AI phân tích web app, tạo kịch bản test hữu ích và giúp team phát hiện regression sớm hơn.",
      date: "07/06/2026",
      readTime: "5 phút đọc",
    },
    articles: [
      {
        icon: Sparkles,
        category: "AI Testing",
        title: "AI-powered testing là gì?",
        description:
          "Nắm các khái niệm cơ bản về QA có AI hỗ trợ và vị trí của nó trong workflow kiểm thử hiện đại.",
        date: "07/06/2026",
        readTime: "5 phút đọc",
      },
      {
        icon: CheckCircle2,
        category: "Hướng dẫn",
        title: "Cách chuẩn bị project trước khi upload",
        description:
          "Checklist an toàn để tạo file ZIP sạch, không chứa secrets, thư mục lớn hoặc build artifact không cần thiết.",
        date: "07/06/2026",
        readTime: "4 phút đọc",
      },
      {
        icon: BookOpen,
        category: "Hướng dẫn",
        title: "Cách đọc báo cáo test do AI tạo",
        description:
          "Hiểu health score, test pass/fail, issues, screenshots và các đề xuất trong report.",
        date: "07/06/2026",
        readTime: "6 phút đọc",
      },
      {
        icon: Lightbulb,
        category: "Best Practices",
        title: "UI Testing và Functional Testing khác nhau thế nào?",
        description:
          "Biết khi nào nên chọn từng chế độ test cho màn hình, form, điều hướng hoặc luồng người dùng hoàn chỉnh.",
        date: "07/06/2026",
        readTime: "4 phút đọc",
      },
      {
        icon: Newspaper,
        category: "Best Practices",
        title: "5 lỗi testing thường gặp trong web app hiện đại",
        description:
          "Tránh selector dễ vỡ, flow chưa rõ, thiếu test data và các vấn đề khiến automated test thiếu ổn định.",
        date: "07/06/2026",
        readTime: "7 phút đọc",
      },
      {
        icon: LockKeyhole,
        category: "Bảo mật",
        title: "Bảo vệ source code khi dùng công cụ AI",
        description:
          "Các thực hành an toàn khi loại bỏ credentials, .env, private keys và dữ liệu khách hàng trước khi dùng công cụ AI.",
        date: "07/06/2026",
        readTime: "5 phút đọc",
      },
      {
        icon: Rocket,
        category: "Cập nhật",
        title: "Mới: Docs và Community đã sẵn sàng",
        description:
          "Tổng quan nhanh về các tài nguyên mới giúp team học TestPilot, gửi feedback và cải thiện workflow kiểm thử.",
        date: "07/06/2026",
        readTime: "3 phút đọc",
      },
    ],
    newsletterTitle: "Theo dõi các workflow kiểm thử tốt hơn.",
    newsletterText:
      "Cập nhật kiến thức sản phẩm, hướng dẫn QA thực tế và các thay đổi của TestPilot khi nền tảng phát triển.",
    newsletterCta: "Bắt đầu test",
    docsCta: "Đọc tài liệu",
  },
};

export default function BlogPage() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/25 to-white text-slate-900">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_34%)]" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
                <Newspaper className="h-3.5 w-3.5" />
                {t.badge}
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-950">
                {t.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl">
                {t.subtitle}
              </p>
            </div>

            <div className="mt-10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-white/85 px-11 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  readOnly
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {t.categories.map((category, index) => (
                  <span
                    key={category}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      index === 0
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-center">
              <div className="rounded-3xl bg-slate-950 p-8 text-white min-h-[280px] flex flex-col justify-between overflow-hidden relative">
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/30 blur-2xl" />
                <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-orange-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.featuredLabel}
                  </div>
                  <h2 className="mt-6 text-3xl font-display font-bold leading-tight">
                    {t.featured.title}
                  </h2>
                </div>
                <div className="relative mt-8 flex items-center gap-4 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{t.featured.date}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{t.featured.readTime}</span>
                </div>
              </div>

              <div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                  {t.featured.category}
                </span>
                <h3 className="mt-5 text-3xl md:text-4xl font-display font-bold text-slate-950">
                  {t.featured.title}
                </h3>
                <p className="mt-4 text-slate-600 leading-7">
                  {t.featured.description}
                </p>
                <button className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  {t.comingSoon}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {t.articles.map((article) => {
              const Icon = article.icon;
              return (
                <article key={article.title} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-display font-bold text-slate-950 group-hover:text-orange-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {article.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{article.date}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{article.readTime}</span>
                  </div>
                  <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition group-hover:text-orange-600">
                    {t.comingSoon}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 pb-24">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-8 md:p-12 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[1.3fr_auto] md:items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">
                  {t.newsletterTitle}
                </h2>
                <p className="mt-4 max-w-2xl text-slate-300 leading-7">
                  {t.newsletterText}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/run-test" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-50">
                  {t.newsletterCta}
                </Link>
                <Link to="/docs" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  {t.docsCta}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
