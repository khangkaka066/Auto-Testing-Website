import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bug,
  CheckCircle2,
  HeartHandshake,
  Lightbulb,
  Megaphone,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { useLanguage } from "../lib/i18n";

const content = {
  en: {
    badge: "Community",
    title: "Join the people building better software testing with AI.",
    subtitle:
      "Connect with developers, QA teams, and product builders using TestPilot to discover issues faster, share feedback, and improve testing workflows.",
    primaryCta: "Start testing",
    secondaryCta: "Read the docs",
    channelsTitle: "Community channels",
    channelsSubtitle:
      "Choose the best place to ask questions, suggest improvements, or follow product updates.",
    channels: [
      {
        icon: MessageCircle,
        title: "Ask questions",
        description:
          "Get guidance on preparing projects, choosing test types, and understanding generated reports.",
      },
      {
        icon: Lightbulb,
        title: "Suggest features",
        description:
          "Share ideas that would make TestPilot more useful for your team and workflow.",
      },
      {
        icon: Bug,
        title: "Report issues",
        description:
          "Tell us when something feels unclear, unstable, or does not match your testing expectations.",
      },
      {
        icon: Megaphone,
        title: "Product updates",
        description:
          "Follow improvements, new testing capabilities, and platform changes as TestPilot grows.",
      },
    ],
    reasonsTitle: "Why join?",
    reasons: [
      "Learn practical AI testing workflows from real product teams.",
      "Help shape future TestPilot features with direct feedback.",
      "Discover safer ways to prepare projects before uploading.",
      "Understand common causes of failed tests and unclear reports.",
      "Stay close to product updates, roadmap direction, and support resources.",
    ],
    guidelinesTitle: "Community guidelines",
    guidelinesSubtitle:
      "A good testing community should be useful, respectful, and safe for every team.",
    guidelines: [
      {
        icon: HeartHandshake,
        title: "Be respectful",
        description:
          "Keep discussions constructive, friendly, and focused on helping teams improve quality.",
      },
      {
        icon: CheckCircle2,
        title: "Share useful context",
        description:
          "When asking for help, describe the goal, the test type, and the behavior you expected.",
      },
      {
        icon: ShieldAlert,
        title: "Protect sensitive data",
        description:
          "Do not post private source code, credentials, .env files, API keys, customer data, or security secrets.",
      },
    ],
    ctaTitle: "Ready to improve your testing workflow?",
    ctaText:
      "Start with the documentation, run your first test, and share feedback with the TestPilot team as your workflow grows.",
  },
  vi: {
    badge: "Cộng đồng",
    title: "Tham gia cộng đồng xây dựng kiểm thử phần mềm tốt hơn bằng AI.",
    subtitle:
      "Kết nối với developer, QA team và product team đang dùng TestPilot để phát hiện lỗi nhanh hơn, chia sẻ phản hồi và cải thiện quy trình kiểm thử.",
    primaryCta: "Bắt đầu test",
    secondaryCta: "Đọc tài liệu",
    channelsTitle: "Kênh cộng đồng",
    channelsSubtitle:
      "Chọn nơi phù hợp để đặt câu hỏi, đề xuất cải tiến hoặc theo dõi cập nhật sản phẩm.",
    channels: [
      {
        icon: MessageCircle,
        title: "Đặt câu hỏi",
        description:
          "Nhận hướng dẫn về cách chuẩn bị dự án, chọn loại test và đọc báo cáo được tạo ra.",
      },
      {
        icon: Lightbulb,
        title: "Đề xuất tính năng",
        description:
          "Chia sẻ ý tưởng giúp TestPilot phù hợp hơn với team và workflow của bạn.",
      },
      {
        icon: Bug,
        title: "Báo lỗi sản phẩm",
        description:
          "Thông báo khi có phần chưa rõ ràng, chưa ổn định hoặc chưa đúng kỳ vọng kiểm thử.",
      },
      {
        icon: Megaphone,
        title: "Cập nhật sản phẩm",
        description:
          "Theo dõi cải tiến, khả năng testing mới và thay đổi nền tảng khi TestPilot phát triển.",
      },
    ],
    reasonsTitle: "Vì sao nên tham gia?",
    reasons: [
      "Học các workflow AI testing thực tế từ những product team khác.",
      "Góp phần định hình tính năng TestPilot trong tương lai bằng phản hồi trực tiếp.",
      "Biết cách chuẩn bị dự án an toàn hơn trước khi upload.",
      "Hiểu các nguyên nhân thường gặp khiến test fail hoặc report khó đọc.",
      "Theo dõi cập nhật sản phẩm, định hướng roadmap và tài nguyên hỗ trợ.",
    ],
    guidelinesTitle: "Quy tắc cộng đồng",
    guidelinesSubtitle:
      "Một cộng đồng testing tốt cần hữu ích, tôn trọng và an toàn cho mọi team.",
    guidelines: [
      {
        icon: HeartHandshake,
        title: "Tôn trọng lẫn nhau",
        description:
          "Giữ thảo luận mang tính xây dựng, thân thiện và tập trung giúp team cải thiện chất lượng.",
      },
      {
        icon: CheckCircle2,
        title: "Chia sẻ ngữ cảnh hữu ích",
        description:
          "Khi cần hỗ trợ, hãy mô tả mục tiêu, loại test và hành vi bạn mong đợi.",
      },
      {
        icon: ShieldAlert,
        title: "Bảo vệ dữ liệu nhạy cảm",
        description:
          "Không đăng source code riêng tư, credentials, file .env, API key, dữ liệu khách hàng hoặc secrets bảo mật.",
      },
    ],
    ctaTitle: "Sẵn sàng cải thiện workflow kiểm thử?",
    ctaText:
      "Bắt đầu từ tài liệu, chạy test đầu tiên và chia sẻ phản hồi với đội ngũ TestPilot khi workflow của bạn phát triển.",
  },
};

export default function CommunityPage() {
  const { language } = useLanguage();
  const t = content[language] || content.en;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_30%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                <Users className="h-4 w-4" />
                {t.badge}
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
                {t.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 md:text-xl">
                {t.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/run-test"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  {t.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {t.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              <Sparkles className="h-3.5 w-3.5" />
              TestPilot
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              {t.channelsTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {t.channelsSubtitle}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {t.channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <article key={channel.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{channel.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{channel.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                {t.reasonsTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                TestPilot community helps users get more value from AI-powered testing without exposing internal implementation details.
              </p>
            </div>
            <div className="space-y-4">
              {t.reasons.map((reason) => (
                <div key={reason} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                  <p className="text-sm leading-6 text-slate-700">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              {t.guidelinesTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {t.guidelinesSubtitle}
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {t.guidelines.map((guide) => {
              const Icon = guide.icon;
              return (
                <article key={guide.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{guide.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{guide.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-8">
          <div className="overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-xl md:p-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t.ctaTitle}</h2>
                <p className="mt-4 text-base leading-7 text-slate-300">{t.ctaText}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
                <Link
                  to="/docs"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  {t.secondaryCta}
                </Link>
                <Link
                  to="/run-test"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {t.primaryCta}
                  <ArrowRight className="h-4 w-4" />
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
