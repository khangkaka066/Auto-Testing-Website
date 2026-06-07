import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  FileCode2,
  Github,
  LayoutDashboard,
  PlayCircle,
  Upload,
  Wand2,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { useLanguage } from "../lib/i18n";

const quickStarts = [
  {
    icon: Upload,
    title: "Upload a project",
    description:
      "Start with a ZIP file when you want the fastest setup. TestPilot extracts the source, indexes the app, and prepares it for automated analysis.",
  },
  {
    icon: Github,
    title: "Connect GitHub",
    description:
      "Choose a repository and branch through GitHub OAuth. TestPilot keeps project metadata in sync so every run uses the correct source.",
  },
  {
    icon: Wand2,
    title: "Generate tests with AI",
    description:
      "Describe a user flow in plain English. The AI author creates end-to-end scenarios that you can review before running.",
  },
];

const guides = [
  "Create your first automated test run",
  "Read pass, fail, and warning states in a report",
  "Debug selectors with screenshots and traces",
  "Manage project settings and account profile",
];

const apiExamples = [
  {
    method: "POST",
    endpoint: "/api/projects/upload",
    copy: "Upload a ZIP archive and create a project workspace.",
  },
  {
    method: "GET",
    endpoint: "/api/test-runs/:projectId",
    copy: "Fetch the latest status for a running or completed test job.",
  },
  {
    method: "GET",
    endpoint: "/api/reports/:projectId",
    copy: "Open the generated test report, including logs and summary metrics.",
  },
];

const docsVi = {
  quickStarts: [
    { title: "Upload project", description: "Bắt đầu bằng file ZIP khi bạn muốn setup nhanh nhất. TestPilot giải nén source, index app và chuẩn bị phân tích tự động." },
    { title: "Kết nối GitHub", description: "Chọn repository và branch qua GitHub OAuth. TestPilot đồng bộ metadata dự án để mỗi lượt chạy dùng đúng source." },
    { title: "Tạo test bằng AI", description: "Mô tả user flow bằng ngôn ngữ tự nhiên. AI author tạo các kịch bản end-to-end để bạn review trước khi chạy." },
  ],
  guides: [
    "Tạo lượt chạy automated test đầu tiên",
    "Đọc trạng thái pass, fail và warning trong báo cáo",
    "Debug selectors bằng screenshots và traces",
    "Quản lý cài đặt dự án và hồ sơ tài khoản",
  ],
  apiExamples: [
    { copy: "Upload file ZIP và tạo workspace cho dự án." },
    { copy: "Lấy trạng thái mới nhất của test job đang chạy hoặc đã hoàn tất." },
    { copy: "Mở báo cáo test đã tạo, bao gồm logs và metrics tổng quan." },
  ],
  badge: "Tài liệu",
  title: "Tìm hiểu cách ship test đáng tin cậy với TestPilot.",
  subtitle: "Tìm các bước setup, hướng dẫn sản phẩm, workflow kiểm thử và ghi chú API để dùng TestPilot từ dự án đầu tiên đến production CI.",
  startProject: "Bắt đầu dự án",
  readQuickStart: "Đọc quick start",
  quickStart: "Bắt đầu nhanh",
  quickTitle: "Từ source code đến báo cáo đầu tiên.",
  quickBody: "Đây là các bước cốt lõi: kết nối app, cấu hình mục tiêu kiểm thử, chạy test và xem kết quả đã tạo.",
  guidesLabel: "Hướng dẫn",
  guidesTitle: "Workflow thường dùng",
  guidesBody: "Dùng các hướng dẫn này khi bạn cần chỉ dẫn thực tế thay vì nội dung marketing. Mỗi chủ đề tương ứng một hành trình phổ biến của người dùng TestPilot.",
  cards: [
    { title: "Dashboard", body: "Theo dõi projects, lượt test gần đây, thông tin tài khoản và điều hướng tới report trong một workspace." },
    { title: "Test runner", body: "Khởi chạy kiểm tra tự động, theo dõi tiến trình và đi thẳng tới báo cáo khi chạy xong." },
    { title: "Reports", body: "Xem pass rates, failure logs, screenshots và ghi chú hành động để team biết cần sửa gì tiếp theo." },
  ],
  apiLabel: "Tham chiếu API",
  apiTitle: "Backend endpoints hữu ích",
  apiBody: "Ứng dụng dùng API routes cho xác thực, uploads, thực thi test và reports. Hãy giữ token trong Authorization header khi gọi endpoint được bảo vệ.",
};

export default function DocsPage() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const copy = vi ? docsVi : null;
  const quickStartItems = vi ? quickStarts.map((item, i) => ({ ...item, ...docsVi.quickStarts[i] })) : quickStarts;
  const guideItems = copy?.guides || guides;
  const apiItems = vi ? apiExamples.map((item, i) => ({ ...item, ...docsVi.apiExamples[i] })) : apiExamples;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_35%),radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%)]" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
              <BookOpen className="h-3.5 w-3.5" /> {copy?.badge || "Documentation"}
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-950">
              {copy?.title || "Learn how to ship reliable tests with TestPilot."}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600 leading-8">
              {copy?.subtitle || "Find setup steps, product guides, testing workflows, and API notes for using TestPilot from your first project to production CI."}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy?.startProject || "Start a project"} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#quick-start"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
              >
                {copy?.readQuickStart || "Read quick start"}
              </a>
            </div>
          </div>
        </section>

        <section id="quick-start" className="max-w-7xl mx-auto px-6 md:px-8 py-16 text-left">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">{copy?.quickStart || "Quick start"}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{copy?.quickTitle || "Get from source code to first report."}</h2>
            <p className="mt-4 text-slate-600 leading-7">
              {copy?.quickBody || "These are the core steps most documentation pages provide first: connect your app, configure the testing target, run tests, and inspect the generated result."}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {quickStartItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] text-left">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">{copy?.guidesLabel || "Guides"}</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{copy?.guidesTitle || "Common workflows"}</h2>
              <p className="mt-4 text-slate-600 leading-7">
                {copy?.guidesBody || "Use these guides when you need practical instructions instead of marketing copy. Each topic maps to a common TestPilot user journey."}
              </p>
            </div>
            <div className="grid gap-3">
              {guideItems.map((guide) => (
                <div key={guide} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-slate-700">{guide}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 text-left">
          <div className="grid gap-8 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <LayoutDashboard className="h-6 w-6 text-orange-600" />
              <h3 className="mt-4 text-xl font-semibold">{copy?.cards[0].title || "Dashboard"}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {copy?.cards[0].body || "Track projects, recent test runs, account details, and navigation to report pages from one workspace."}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <PlayCircle className="h-6 w-6 text-orange-600" />
              <h3 className="mt-4 text-xl font-semibold">{copy?.cards[1].title || "Test runner"}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {copy?.cards[1].body || "Launch automated checks, watch progress, and move directly into a generated report when execution completes."}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FileCode2 className="h-6 w-6 text-orange-600" />
              <h3 className="mt-4 text-xl font-semibold">{copy?.cards[2].title || "Reports"}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {copy?.cards[2].body || "Review pass rates, failure logs, screenshots, and actionable notes so your team knows what to fix next."}
              </p>
            </article>
          </div>
        </section>

        <section id="api-reference" className="bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 text-left">
            <div className="flex items-center gap-2 text-orange-300 text-sm font-semibold uppercase tracking-[0.18em]">
              <Code2 className="h-4 w-4" /> {copy?.apiLabel || "API reference"}
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">{copy?.apiTitle || "Useful backend endpoints"}</h2>
            <p className="mt-4 max-w-2xl text-slate-300 leading-7">
              {copy?.apiBody || "The app uses API routes for authentication, uploads, test execution, and reports. Keep tokens in the Authorization header when calling protected endpoints."}
            </p>
            <div className="mt-8 grid gap-4">
              {apiItems.map((item) => (
                <div key={item.endpoint} className="rounded-xl border border-white/10 bg-white/5 p-4 md:flex md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-orange-500/15 px-2 py-1 text-xs font-bold text-orange-200">{item.method}</span>
                      <code className="text-sm text-slate-100">{item.endpoint}</code>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
