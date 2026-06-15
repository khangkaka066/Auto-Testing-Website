import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { useLanguage } from "../lib/i18n";

const content = {
  en: {
    badge: "Product documentation",
    title: "Use TestPilot to turn source code into actionable test reports.",
    subtitle:
      "Learn how to prepare your project, choose the right test type, run AI-powered checks, and understand the report your team receives.",
    primaryCta: "Start testing",
    secondaryCta: "Read upload guide",
    introCards: [
      {
        icon: Upload,
        title: "Upload safely",
        description:
          "Prepare a clean ZIP file, remove secrets, and give TestPilot only the files needed to understand and test your web app.",
      },
      {
        icon: Sparkles,
        title: "Generate with AI",
        description:
          "TestPilot analyzes your application structure and creates relevant scenarios for UI, API, or functional testing.",
      },
      {
        icon: FileText,
        title: "Review the report",
        description:
          "Use pass rates, failed steps, logs, and recommendations to decide what your team should fix or verify next.",
      },
    ],
    sections: {
      gettingStarted: {
        label: "Getting started",
        title: "Run your first AI test in a few steps.",
        body:
          "TestPilot is designed for teams that want testing feedback without writing every test case manually. The basic workflow is simple:",
        steps: [
          "Create an account or sign in to your workspace.",
          "Upload a clean ZIP version of your web application, or connect a repository when GitHub import is available for your account.",
          "Choose the test type that matches your goal: UI, API, or Functional Testing.",
          "Start the run and wait for TestPilot to analyze the app, generate checks, execute them, and prepare a report.",
          "Open the report, review failed cases, and share the findings with your team.",
        ],
      },
      upload: {
        label: "Upload guide",
        title: "Prepare your project before uploading.",
        body:
          "A clean upload helps TestPilot analyze your application faster and reduces false failures caused by missing or unnecessary files.",
        dos: [
          "Use a .zip file containing the project source code.",
          "Keep important files such as package.json, routes, pages, components, and public assets.",
          "Upload a project that can run as a web application, especially modern JavaScript frontends.",
          "Remove unnecessary folders before uploading to keep the archive smaller.",
        ],
        donts: [
          "Do not include .env files, private keys, API tokens, credentials, or certificates.",
          "Do not include node_modules, build artifacts, cache folders, or large temporary files.",
          "Do not upload production databases, customer data, or files unrelated to testing the app.",
        ],
      },
      testTypes: {
        label: "Test types",
        title: "Choose the right testing mode.",
        body:
          "Each test type tells TestPilot what kind of behavior to prioritize when creating scenarios.",
        items: [
          {
            title: "UI Testing",
            description:
              "Checks visible screens, buttons, forms, navigation, layout states, and common user interactions.",
          },
          {
            title: "API Testing",
            description:
              "Focuses on request and response behavior when your project exposes or depends on API flows that can be tested safely.",
          },
          {
            title: "Functional Testing",
            description:
              "Validates complete user journeys such as signing in, submitting forms, moving through a dashboard, or completing a core workflow.",
          },
        ],
      },
      reports: {
        label: "Reports",
        title: "Understand the result of a test run.",
        body:
          "A TestPilot report is meant to help your team decide what to fix, verify, or rerun. A failed test is a signal to investigate, not always proof that the product is broken.",
        metrics: [
          { name: "Health score", meaning: "A high-level quality signal based on the run result and detected issues." },
          { name: "Passed tests", meaning: "Scenarios that completed successfully during execution." },
          { name: "Failed tests", meaning: "Scenarios that did not complete as expected and should be reviewed." },
          { name: "Issues found", meaning: "Potential problems, unstable flows, or behaviors that need attention." },
          { name: "Logs and screenshots", meaning: "Evidence that helps your team reproduce or understand failures." },
        ],
      },
      security: {
        label: "Security & privacy",
        title: "Protect your source code before every upload.",
        body:
          "TestPilot needs enough source code context to understand your web app, but you should never upload secrets or sensitive customer data.",
        items: [
          "Remove .env files and secret configuration before uploading.",
          "Replace private API keys or credentials with sample values when they are needed for context.",
          "Avoid uploading customer data, internal exports, private certificates, or production database files.",
          "Use a dedicated test branch or sanitized copy of the project when possible.",
        ],
        note:
          "Security policy, retention details, and data-processing terms should be published separately as your startup formalizes customer agreements.",
      },
      troubleshooting: {
        label: "Troubleshooting",
        title: "Fix common issues quickly.",
        rows: [
          {
            problem: "Upload failed",
            reason: "The file is not a ZIP archive, is too large, or contains unsupported content.",
            solution: "Create a smaller ZIP, remove unnecessary folders, and try again.",
          },
          {
            problem: "No tests generated",
            reason: "The app structure may be unclear or the uploaded source may be incomplete.",
            solution: "Make sure the upload includes routes, pages, components, and package metadata.",
          },
          {
            problem: "Many tests failed",
            reason: "The app may require login, test data, environment configuration, or manual setup.",
            solution: "Review the failed steps and rerun with a cleaner project or clearer test target.",
          },
          {
            problem: "Report looks incomplete",
            reason: "The run may still be processing or the app may have stopped during execution.",
            solution: "Refresh the report page, check the run status, or start a new run if needed.",
          },
        ],
      },
      faq: {
        label: "FAQ",
        title: "Questions teams usually ask.",
        items: [
          {
            question: "Do I need to write test code?",
            answer:
              "No. TestPilot generates automated test scenarios for you, but your team should still review important failures before making product decisions.",
          },
          {
            question: "Can I upload private source code?",
            answer:
              "Yes, but you should remove secrets, credentials, customer data, and private environment files before uploading.",
          },
          {
            question: "Does TestPilot replace QA engineers?",
            answer:
              "No. It helps QA, engineering, and product teams move faster by automating repetitive checks and surfacing issues earlier.",
          },
          {
            question: "Which projects work best?",
            answer:
              "Modern web applications with clear routes, components, forms, and package metadata usually produce the best results.",
          },
        ],
      },
    },
  },
  vi: {
    badge: "Tài liệu sản phẩm",
    title: "Dùng TestPilot để biến source code thành báo cáo kiểm thử có thể hành động.",
    subtitle:
      "Tìm hiểu cách chuẩn bị project, chọn đúng loại test, chạy kiểm thử bằng AI và đọc báo cáo mà team nhận được.",
    primaryCta: "Bắt đầu test",
    secondaryCta: "Đọc hướng dẫn upload",
    introCards: [
      {
        icon: Upload,
        title: "Upload an toàn",
        description:
          "Chuẩn bị file ZIP sạch, loại bỏ thông tin nhạy cảm và chỉ cung cấp các file cần thiết để TestPilot hiểu web app của bạn.",
      },
      {
        icon: Sparkles,
        title: "Tạo test bằng AI",
        description:
          "TestPilot phân tích cấu trúc ứng dụng và tạo các kịch bản phù hợp cho UI, API hoặc Functional Testing.",
      },
      {
        icon: FileText,
        title: "Đọc báo cáo",
        description:
          "Dựa vào pass rate, bước lỗi, logs và khuyến nghị để team quyết định cần sửa hoặc kiểm tra lại điều gì.",
      },
    ],
    sections: {
      gettingStarted: {
        label: "Bắt đầu",
        title: "Chạy AI test đầu tiên trong vài bước.",
        body:
          "TestPilot được thiết kế cho các team muốn có phản hồi kiểm thử mà không cần tự viết mọi test case thủ công. Workflow cơ bản như sau:",
        steps: [
          "Tạo tài khoản hoặc đăng nhập vào workspace.",
          "Upload file ZIP sạch của web application, hoặc kết nối repository khi tài khoản của bạn có GitHub import.",
          "Chọn loại test phù hợp: UI, API hoặc Functional Testing.",
          "Bắt đầu lượt chạy và chờ TestPilot phân tích app, tạo kiểm thử, thực thi và chuẩn bị báo cáo.",
          "Mở report, xem các case lỗi và chia sẻ findings với team.",
        ],
      },
      upload: {
        label: "Hướng dẫn upload",
        title: "Chuẩn bị project trước khi upload.",
        body:
          "Một bản upload sạch giúp TestPilot phân tích ứng dụng nhanh hơn và giảm lỗi giả do thiếu file hoặc dư file không cần thiết.",
        dos: [
          "Dùng file .zip chứa source code của project.",
          "Giữ các file quan trọng như package.json, routes, pages, components và public assets.",
          "Upload project có thể chạy như một web application, đặc biệt là frontend JavaScript hiện đại.",
          "Loại bỏ thư mục không cần thiết để file nén nhẹ hơn.",
        ],
        donts: [
          "Không đưa .env, private key, API token, credentials hoặc certificates vào file upload.",
          "Không đưa node_modules, build artifacts, cache folders hoặc file tạm dung lượng lớn.",
          "Không upload production database, dữ liệu khách hàng hoặc file không liên quan đến việc test app.",
        ],
      },
      testTypes: {
        label: "Loại test",
        title: "Chọn đúng chế độ kiểm thử.",
        body:
          "Mỗi loại test cho TestPilot biết nên ưu tiên hành vi nào khi tạo kịch bản.",
        items: [
          {
            title: "UI Testing",
            description:
              "Kiểm tra màn hình hiển thị, button, form, navigation, trạng thái layout và các tương tác phổ biến của người dùng.",
          },
          {
            title: "API Testing",
            description:
              "Tập trung vào request/response khi project có API flow có thể kiểm thử an toàn.",
          },
          {
            title: "Functional Testing",
            description:
              "Xác minh các hành trình hoàn chỉnh như đăng nhập, submit form, đi qua dashboard hoặc hoàn thành workflow chính.",
          },
        ],
      },
      reports: {
        label: "Báo cáo",
        title: "Hiểu kết quả của một lượt test.",
        body:
          "Report của TestPilot giúp team quyết định cần sửa, xác minh hoặc chạy lại điều gì. Một test fail là tín hiệu cần điều tra, không phải lúc nào cũng chứng minh sản phẩm bị lỗi.",
        metrics: [
          { name: "Health score", meaning: "Tín hiệu chất lượng tổng quan dựa trên kết quả chạy và các vấn đề phát hiện được." },
          { name: "Passed tests", meaning: "Các kịch bản đã chạy thành công." },
          { name: "Failed tests", meaning: "Các kịch bản không hoàn thành như kỳ vọng và cần được review." },
          { name: "Issues found", meaning: "Vấn đề tiềm năng, flow không ổn định hoặc hành vi cần chú ý." },
          { name: "Logs và screenshots", meaning: "Bằng chứng giúp team tái hiện hoặc hiểu lỗi." },
        ],
      },
      security: {
        label: "Bảo mật & riêng tư",
        title: "Bảo vệ source code trước mỗi lần upload.",
        body:
          "TestPilot cần đủ ngữ cảnh source code để hiểu web app, nhưng bạn không nên upload secret hoặc dữ liệu khách hàng nhạy cảm.",
        items: [
          "Xóa file .env và cấu hình chứa secret trước khi upload.",
          "Thay private API key hoặc credentials bằng giá trị mẫu nếu cần giữ ngữ cảnh.",
          "Tránh upload dữ liệu khách hàng, internal exports, private certificates hoặc production database files.",
          "Nên dùng test branch hoặc bản project đã sanitize khi có thể.",
        ],
        note:
          "Security policy, retention details và điều khoản xử lý dữ liệu nên được công bố riêng khi startup hoàn thiện thỏa thuận với khách hàng.",
      },
      troubleshooting: {
        label: "Xử lý lỗi",
        title: "Sửa các lỗi thường gặp nhanh hơn.",
        rows: [
          {
            problem: "Upload thất bại",
            reason: "File không phải ZIP, quá lớn hoặc chứa nội dung không phù hợp.",
            solution: "Tạo file ZIP nhỏ hơn, xóa thư mục không cần thiết và thử lại.",
          },
          {
            problem: "Không tạo được test",
            reason: "Cấu trúc app chưa rõ hoặc source upload bị thiếu.",
            solution: "Đảm bảo bản upload có routes, pages, components và package metadata.",
          },
          {
            problem: "Nhiều test fail",
            reason: "App có thể cần login, test data, cấu hình môi trường hoặc setup thủ công.",
            solution: "Xem lại bước fail và chạy lại với project sạch hơn hoặc mục tiêu test rõ hơn.",
          },
          {
            problem: "Report chưa đầy đủ",
            reason: "Run có thể vẫn đang xử lý hoặc app đã dừng trong lúc chạy.",
            solution: "Refresh trang report, kiểm tra trạng thái run hoặc bắt đầu run mới nếu cần.",
          },
        ],
      },
      faq: {
        label: "FAQ",
        title: "Những câu hỏi team thường gặp.",
        items: [
          {
            question: "Tôi có cần tự viết test code không?",
            answer:
              "Không. TestPilot tự tạo automated test scenarios, nhưng team vẫn nên review các lỗi quan trọng trước khi đưa ra quyết định sản phẩm.",
          },
          {
            question: "Tôi có thể upload source code private không?",
            answer:
              "Có, nhưng bạn nên xóa secrets, credentials, dữ liệu khách hàng và file môi trường private trước khi upload.",
          },
          {
            question: "TestPilot có thay thế QA engineers không?",
            answer:
              "Không. TestPilot giúp QA, engineering và product team chạy nhanh hơn bằng cách tự động hóa kiểm tra lặp lại và phát hiện issue sớm hơn.",
          },
          {
            question: "Project nào cho kết quả tốt nhất?",
            answer:
              "Web application hiện đại có routes, components, forms và package metadata rõ ràng thường cho kết quả tốt nhất.",
          },
        ],
      },
    },
  },
};

const SectionHeader = ({ label, title, body }) => (
  <div className="max-w-3xl text-left">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">{label}</p>
    <h2 className="mt-3 text-3xl md:text-4xl font-display font-bold tracking-tight text-slate-950">{title}</h2>
    {body && <p className="mt-4 text-slate-600 leading-7">{body}</p>}
  </div>
);

export default function DocsPage() {
  const { language } = useLanguage();
  const copy = content[language] || content.en;
  const { sections } = copy;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-white border-b border-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_34%),radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_30%)]" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
              <BookOpen className="h-3.5 w-3.5" /> {copy.badge}
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-950">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600 leading-8">{copy.subtitle}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.primaryCta} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#upload-guide"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
              >
                {copy.secondaryCta}
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-8 -mt-10 relative z-10">
          <div className="grid gap-5 md:grid-cols-3">
            {copy.introCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left">
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

        <section id="getting-started" className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-left">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
            <SectionHeader {...sections.gettingStarted} />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ol className="space-y-4">
                {sections.gettingStarted.steps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm leading-6 text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="upload-guide" className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-left">
            <SectionHeader {...sections.upload} />
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-5 w-5" /> Recommended
                </div>
                <ul className="mt-5 space-y-3">
                  {sections.upload.dos.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
                <div className="flex items-center gap-2 text-amber-700 font-semibold">
                  <AlertTriangle className="h-5 w-5" /> Avoid uploading
                </div>
                <ul className="mt-5 space-y-3">
                  {sections.upload.donts.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="test-types" className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-left">
          <SectionHeader {...sections.testTypes} />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {sections.testTypes.items.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <PlayCircle className="h-6 w-6 text-orange-600" />
                <h3 className="mt-4 text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="reports" className="bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-left">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">{sections.reports.label}</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-display font-bold tracking-tight">{sections.reports.title}</h2>
              <p className="mt-4 text-slate-300 leading-7">{sections.reports.body}</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {sections.reports.metrics.map((metric) => (
                <article key={metric.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <LayoutDashboard className="h-5 w-5 text-orange-300" />
                  <h3 className="mt-4 text-base font-semibold">{metric.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{metric.meaning}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-left">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] items-start">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <SectionHeader {...sections.security} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ul className="space-y-4">
                {sections.security.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" /> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
                {sections.security.note}
              </div>
            </div>
          </div>
        </section>

        <section id="troubleshooting" className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-left">
            <SectionHeader {...sections.troubleshooting} body={null} />
            <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                <div>Problem</div>
                <div>Possible reason</div>
                <div>Suggested action</div>
              </div>
              {sections.troubleshooting.rows.map((row) => (
                <div key={row.problem} className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-100 px-5 py-5 text-sm leading-6">
                  <div className="font-semibold text-slate-950">{row.problem}</div>
                  <div className="text-slate-600">{row.reason}</div>
                  <div className="text-slate-700">{row.solution}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="docs-faq" className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-left">
          <SectionHeader {...sections.faq} body={null} />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {sections.faq.items.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
