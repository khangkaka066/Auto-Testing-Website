import React, { createContext, useContext, useMemo, useState } from "react";
import * as landingEn from "../content/landing";
import { billingT as billingEn } from "../content/billing";
import { dashboardT as dashboardEn } from "../content/dashboard";
import { profileT as profileEn } from "../content/profile";
import { testRunnerT as testRunnerEn, testProgressT as testProgressEn, testReportT as testReportEn } from "../content/testing";

const STORAGE_KEY = "testpilot_language";

const landingVi = {
  navbarT: {
    ...landingEn.navbarT,
    workspace: "Workspace",
    yourAccount: "Tài khoản của bạn",
    profile: "Hồ sơ",
    accountSettings: "Cài đặt tài khoản",
    signOut: "Đăng xuất",
    signIn: "Đăng nhập",
    start: "Bắt đầu",
    loggedOut: "Đã đăng xuất thành công!",
    language: "Ngôn ngữ",
  },
  heroT: {
    badge: "v2.4 - AI viết test",
    headline1: "Ship nhanh hơn.",
    headline2: "Với",
    highlight: "ít lỗi hơn",
    subtitle: "TestPilot là nền tảng QA tự động có thể viết, chạy và duy trì end-to-end test. Phát hiện regression trên nhiều trình duyệt trước khi lên production.",
    primaryCta: "Bắt đầu test",
    secondaryCta: "Xem demo 2 phút",
    benefits: ["Không cần thẻ", "Dùng thử 14 ngày", "Huỷ bất cứ lúc nào"],
    statLabels: { tests: "Tests", passed: "Passed", duration: "Thời gian" },
    liveRun: "Đang chạy",
    checkoutFlow: "Luồng checkout - Chrome",
    passing: "PASSING",
    aiAuthor: "AI Author",
    generated: "Đã tạo 12 tests",
  },
  featuresT: {
    header: {
      label: "Khả năng",
      title: "Mọi thứ bạn cần để ship tự tin.",
      subtitle: "Từ test case do AI tạo đến visual diff chính xác từng pixel, TestPilot bao phủ mọi lớp kiểm thử chất lượng.",
    },
    cards: [
      { title: "E2E test do AI viết", description: "Mô tả flow bằng ngôn ngữ tự nhiên. TestPilot viết, chạy và tự sửa test khi UI thay đổi.", codeComment: "// Tạo từ prompt" },
      { title: "Visual regression", description: "Bắt các thay đổi lệch một pixel. So sánh song song nhiều breakpoint với vùng bỏ qua thông minh." },
      { title: "Cross-browser quy mô lớn", description: "Chạy song song trên Chrome, Firefox, Safari và Edge, cả desktop lẫn mobile viewport." },
      { title: "Tích hợp CI/CD", description: "Action sẵn cho GitHub, GitLab và CircleCI. Chặn PR làm hỏng build." },
      { title: "Chạy nhanh hơn 10 lần", description: "Song song hoá và chia nhỏ test thông minh. Full suite trong chưa đến một phút." },
      { title: "Bảo mật chuẩn SOC 2", description: "Mã hoá secrets, runner cô lập, phân quyền theo vai trò. Sẵn sàng cho enterprise." },
    ],
  },
  howItWorksT: {
    header: {
      label: "Cách hoạt động",
      title: "Từ con số 0 đến build xanh trong bốn bước.",
      subtitle: "Không cần chuyên sâu DevOps. Kết nối TestPilot một lần và để nền tảng xử lý phần còn lại.",
    },
    stepLabel: "Bước",
    steps: [
      { title: "Kết nối repo", body: "Cài đặt một chạm cho GitHub, GitLab hoặc Bitbucket. Chúng tôi tự động index app và routes." },
      { title: "Mô tả cần test", body: "Nhập flow bằng tiếng Anh/tự nhiên hoặc import Playwright/Cypress specs có sẵn. AI chuyển đổi trong vài giây." },
      { title: "Chạy trên mỗi commit", body: "TestPilot chạy job song song trên nhiều trình duyệt và thiết bị. Lỗi có video, traces và DOM snapshots." },
      { title: "Tự sửa và merge", body: "Khi selector thay đổi, TestPilot viết lại selector. PR ship nhanh hơn mà không bị flaky tests." },
    ],
  },
  pricingT: {
    header: {
      label: "Bảng giá",
      title: "Chọn Plus hoặc trả theo credits.",
      subtitle: "Bắt đầu với 2 credits miễn phí, sau đó dùng gói tháng ổn định hoặc nạp credits linh hoạt.",
    },
    mostPopular: "Phổ biến nhất",
    tiers: [
      { name: "Plus", price: "10", period: "tháng", desc: "Dành cho developer test thường xuyên và muốn chi phí hằng tháng dễ dự đoán.", features: ["15 lượt test tiêu chuẩn / tháng", "Tuỳ chọn đề xuất sửa code", "Engine tạo test tốt hơn", "Lượt chạy thêm dùng credits", "Allowance reset theo mỗi chu kỳ thanh toán"], cta: "Đăng ký", highlighted: true },
      { name: "Credits", price: "1", period: "credit", desc: "Dành cho test không thường xuyên, lượt chạy lớn hoặc vượt allowance của Plus.", features: ["$1 mỗi credit", "Nạp tối thiểu: 4 credits", "Credits không hết hạn", "Dùng credits cho lượt chạy lớn hoặc chạy thêm", "Tặng 2 credits khi đăng ký"], cta: "Mua credits" },
    ],
  },
  testimonialsT: {
    header: { label: "Được builder tin dùng", title: "Những team ghét build hỏng đều yêu TestPilot." },
    items: [
      { quote: "Chúng tôi rút chu kỳ release từ hai tuần xuống hai ngày. Test tự phục hồi của TestPilot không còn vỡ, kể cả khi đại tu UI.", name: "Maya Patel", role: "QA Lead, Northwind" },
      { quote: "Staging bắt được ba regression checkout ngay tuần đầu. AI authoring tiết kiệm cho team tôi nửa ngày mỗi sprint.", name: "Daniel Kim", role: "Head of Engineering, Loop" },
      { quote: "Visual diff trên 12 viewport trong 40 giây. Chúng tôi thay hai công cụ trả phí bằng TestPilot và không quay lại nữa.", name: "Sofia Lange", role: "Frontend Director, Klear" },
    ],
    stats: [
      { v: "98.6%", l: "Ít flaky hơn" },
      { v: "10x", l: "Chạy nhanh hơn" },
      { v: "4,200+", l: "Team đang ship" },
      { v: "SOC 2", l: "Type II" },
    ],
  },
  faqT: {
    header: { label: "FAQ", title: "Câu hỏi thường gặp." },
    items: [
      { q: "Tôi có cần viết code để dùng TestPilot không?", a: "Không. Bạn có thể mô tả flow bằng ngôn ngữ tự nhiên và TestPilot sẽ tạo, duy trì test cho bạn. Người dùng nâng cao vẫn có thể viết hoặc import Playwright / Cypress specs." },
      { q: "Hỗ trợ trình duyệt và thiết bị nào?", a: "Chrome, Firefox, Safari và Edge trên desktop, cùng iOS Safari và Android Chrome viewport. Test chạy song song trên tất cả." },
      { q: "Self-healing hoạt động thế nào?", a: "Khi selector thay đổi, TestPilot dùng heuristics và vision model để tìm lại element rồi đề xuất bản sửa. Bạn có thể auto-merge hoặc review." },
      { q: "Có chạy TestPilot trong CI riêng được không?", a: "Có. Có sẵn tích hợp GitHub Actions, GitLab CI và CircleCI. Bạn cũng có thể trigger qua REST API hoặc CLI." },
      { q: "Dữ liệu của tôi có an toàn không?", a: "Runner được cô lập, secrets được mã hoá khi lưu trữ và truy cập theo vai trò. Chúng tôi đạt SOC 2 Type II và tuân thủ GDPR." },
      { q: "Sau trial miễn phí thì sao?", a: "Bạn tự động về Free plan, không bị trừ thẻ. Có thể nâng cấp lên Pro bất cứ lúc nào để mở thêm lượt chạy và tính năng." },
    ],
  },
  finalCtaT: {
    badge: "Bắt đầu trong 60 giây",
    headline1: "Ngừng đuổi theo bug.",
    headline2: "Bắt đầu ship.",
    paragraph: "Tham gia cùng các team dùng TestPilot để release phần mềm tự tin hơn, không flaky tests, không rollback lúc nửa đêm.",
    primaryCta: "Bắt đầu miễn phí",
    secondaryCta: "Đặt lịch demo",
  },
  footerT: {
    tagline: "Nền tảng QA tự động cho những team ship mỗi ngày.",
    copyright: "© 2026 TestPilot, Inc. All rights reserved.",
    builtFor: "Built for builders · v2.4.0",
    cols: [
      { title: "Product", links: ["Features", "Changelog", "Roadmap"] },
      { title: "Company", links: ["About", "Customers", "Contact"] },
      { title: "Resources", links: ["Docs", "API reference", "Blog", "Community", "Status"] },
      { title: "Legal", links: ["Privacy", "Terms", "Security", "SOC 2", "DPA"] },
    ],
  },
};

const translations = {
  en: {
    landing: { ...landingEn },
    billing: { billingT: billingEn },
    dashboard: { dashboardT: dashboardEn },
    profile: { profileT: profileEn },
    testing: { testRunnerT: testRunnerEn, testProgressT: testProgressEn, testReportT: testReportEn },
  },
  vi: {
    landing: landingVi,
    billing: {
      billingT: {
        ...billingEn,
        title: "Thanh toán",
        pageTitle: "Thanh toán & Credits",
        subtitle: "Quản lý số dư credit và giao dịch",
        overview: {
          available: "Credits khả dụng",
          purchased: "Tổng đã mua",
          spent: "Tổng đã dùng",
          transactions: "giao dịch",
          usedPercent: "đã dùng",
          tokensSpent: "tokens đã dùng",
          lifetimeSpend: "Chi tiêu trọn đời",
        },
        warnings: {
          lowCredits: "Credits sắp hết",
          lowCreditsHint: "credits còn lại. Hãy nạp thêm để tiếp tục chạy test không gián đoạn.",
          notConfigured: "Chưa cấu hình thanh toán",
          notConfiguredHint: "Thêm STRIPE_SECRET_KEY và STRIPE_WEBHOOK_SECRET vào backend .env để bật thanh toán.",
        },
        packages: {
          title: "Tuỳ chọn thanh toán",
          mostPopular: "Phổ biến nhất",
          bestValue: "Giá tốt nhất",
          usd: "USD",
          creditsUnit: "credits",
          buyFor: "Mua với giá",
          notConfigured: "Chưa cấu hình thanh toán",
          redirecting: "Đang chuyển hướng...",
          monthlyPlan: "Gói tháng",
          plusDescription: "Kiểm thử hằng tháng ổn định cho người dùng thường xuyên",
          plusRuns: "15 lượt test tiêu chuẩn mỗi chu kỳ thanh toán",
          plusFeatures: [
            "15 lượt test tiêu chuẩn/tháng",
            "Tuỳ chọn đề xuất sửa code",
            "Engine tạo test tốt hơn",
            "Lượt chạy thêm tiếp tục dùng credits",
          ],
          subscribeComingSoon: "Subscription sắp ra mắt",
          payAsYouGo: "Trả theo nhu cầu",
          creditsDescription: "Nạp linh hoạt cho lượt chạy lớn hoặc cần thêm capacity",
          minimumPurchase: "Nạp tối thiểu",
          creditAmount: "Số lượng credit",
          neverExpire: "Credits không hết hạn",
          total: "Tổng",
          buyCredits: "Mua {amount} credits với giá ${total}",
        },
        history: {
          title: "Lịch sử giao dịch",
          records: "bản ghi",
          package: "Gói",
          credits: "Credits",
          amount: "Số tiền",
          status: "Trạng thái",
          date: "Ngày",
          empty: "Chưa có giao dịch",
          emptyHint: "Lịch sử mua hàng sẽ xuất hiện tại đây",
          completed: "hoàn tất",
          pending: "đang xử lý",
        },
        toasts: {
          paymentSuccess: "Thanh toán thành công! Credits đã được cộng vào tài khoản.",
          paymentCancelled: "Thanh toán đã huỷ.",
          checkoutFailed: "Không thể bắt đầu checkout",
          loggedOut: "Đã đăng xuất thành công!",
        },
      },
    },
    dashboard: {
      dashboardT: {
        ...dashboardEn,
        nav: { dashboard: "Dashboard", testHistory: "Lịch sử test", profile: "Hồ sơ", billing: "Thanh toán", freePlan: "Gói miễn phí", signOut: "Đăng xuất", loggedOut: "Đã đăng xuất thành công!" },
        welcome: "Chào mừng trở lại",
        subtitle: "Quản lý các chiến dịch kiểm thử tự động",
        stats: { ...dashboardEn.stats, totalTests: "Tổng tests", successRate: "Tỷ lệ thành công", avgScore: "Điểm TB", bestScore: "Điểm tốt nhất", thisMonth: "Tháng này", totalPassed: "Tổng passed", avgDuration: "Thời gian TB", creditsLeft: "Credits còn lại", completed: "hoàn tất", failed: "thất bại", goodHealth: "Tốt", needsReview: "Cần xem lại", allTimeHigh: "Cao nhất", loading: "Đang tải...", perTestRun: "Mỗi lượt test" },
        runTests: { ...dashboardEn.runTests, title: "Chạy Web Tests", subtitle: "Upload source code để bắt đầu AI testing tự động", readyToTest: "Sẵn sàng test", dragDrop: "Kéo & thả file .zip vào đây", or: "hoặc", browseFiles: "chọn file", maxSize: "Tối đa 200 MB", connectGithub: "Kết nối tài khoản GitHub", githubPermission: "TestPilot sẽ xin quyền đọc để clone repo public và private", connectBtn: "Kết nối GitHub", connected: "Đã kết nối", reconnect: "Kết nối lại", repository: "Repository", searchRepos: "Tìm repo...", loadingRepos: "Đang tải repositories...", private: "Private", branch: "Branch", testType: "Loại test", uiTesting: "UI Testing", apiTesting: "API Testing", functionalTesting: "Functional Testing", function: "Function", aiPowered: "AI tạo và thực thi test tự động", startTesting: "Bắt đầu test", starting: "Đang bắt đầu..." },
        lastResult: { ...dashboardEn.lastResult, title: "Kết quả gần nhất", noResults: "Chưa có kết quả", noResultsHint: "Chạy test đầu tiên để xem thống kê", healthScore: "Điểm sức khoẻ", healthy: "Tốt", fair: "Ổn", critical: "Nghiêm trọng", passed: "Passed", failed: "Failed", total: "Tổng", duration: "Thời gian:", issues: "vấn đề" },
        credits: { warning: "Credits sắp hết", remaining: "còn lại", hint: "Nạp thêm để tránh gián đoạn khi chạy test.", topUp: "Nạp thêm" },
        history: { ...dashboardEn.history, title: "Lịch sử test", runs: "lượt chạy · đã lưu vào tài khoản", completed: "hoàn tất", failed: "thất bại", success: "thành công", project: "Dự án", started: "Bắt đầu", duration: "Thời gian", status: "Trạng thái", passedFailed: "Passed / Failed", score: "Điểm", report: "Báo cáo", empty: "Chưa có lịch sử test", emptyHint: "Chạy test đầu tiên để xem kết quả tại đây" },
        toasts: { ...dashboardEn.toasts, githubConnected: "Đã kết nối GitHub", githubFailed: "Kết nối GitHub thất bại", selectZip: "Vui lòng chọn file .zip", githubExpired: "GitHub token hết hạn. Vui lòng kết nối lại.", selectZipFirst: "Vui lòng chọn file .zip trước", selectRepo: "Vui lòng chọn repository", pipelineStarted: "Pipeline test đã bắt đầu!", cloningStarted: "pipeline đã bắt đầu!", startFailed: "Không thể bắt đầu test" },
      },
    },
    profile: {
      profileT: {
        ...profileEn,
        backToDashboard: "Quay lại Dashboard",
        title: "Hồ sơ",
        subtitle: "Cập nhật tên hiển thị và ảnh đại diện.",
        fullName: "Họ và tên",
        email: "Email (chỉ đọc)",
        newPassword: "Mật khẩu mới (để trống nếu giữ mật khẩu hiện tại)",
        changePhoto: "Đổi ảnh đại diện",
        uploading: "Đang tải lên...",
        saveChanges: "Lưu thay đổi",
        loading: "Đang tải thông tin tài khoản...",
        toasts: { signInRequired: "Vui lòng đăng nhập để sử dụng tính năng này", photoUpdated: "Cập nhật ảnh đại diện thành công!", imageOnly: "Vui lòng chỉ chọn file ảnh!", photoFailed: "Upload ảnh thất bại", loadFailed: "Không thể tải hồ sơ", updateFailed: "Cập nhật hồ sơ thất bại" },
      },
    },
    testing: {
      testRunnerT: { ...testRunnerEn, backToWorkspace: "Quay lại Workspace", title: "Khởi chạy Auto Test", subtitle: "Upload file .zip chứa source code. Hệ thống sẽ lưu vào workspace, giải nén và chuẩn bị phân tích tự động.", dropzone: { title: "Kéo & thả file source code .zip vào đây", subtitle: "hoặc bấm để chọn từ máy", supported: "Hỗ trợ: .zip", remove: "Xoá file" }, testType: "Loại test", startBtn: "Bắt đầu test", starting: "Đang bắt đầu...", toasts: { ...testRunnerEn.toasts, selectZip: "Vui lòng chọn file source code .zip", fileSelected: "Đã chọn file", uploadFirst: "Vui lòng upload file .zip để bắt đầu!", pipelineStarted: "Pipeline test đã bắt đầu!", uploadError: "Có lỗi khi upload source code" } },
      testProgressT: { ...testProgressEn, backToWorkspace: "Quay lại Workspace", title: "Tiến trình Auto Test", status: "Trạng thái", currentStage: "Giai đoạn hiện tại", loading: "Đang tải...", report: "Báo cáo", failureDetails: "Chi tiết lỗi", noErrorMessage: "Pipeline dừng trước khi trả về thông báo lỗi.", viewReport: "Xem báo cáo", goToWorkspace: "Đi tới Workspace", signInRequired: "Vui lòng đăng nhập để xem tiến trình test" },
      testReportT: { ...testReportEn, backToWorkspace: "Quay lại Workspace", title: "Báo cáo test cuối cùng", testResult: "Kết quả test", summary: { executionTime: "Thời gian chạy", passed: "Passed", failed: "Failed", totalTests: "Tổng tests", finishedAt: "Hoàn tất lúc" }, issues: { title: "Vấn đề phát hiện", unit: "vấn đề", none: "Không có vấn đề nào trong kết quả cuối." }, loading: "Đang tải báo cáo...", notAvailable: "Báo cáo chưa khả dụng", notAvailableHint: "Lượt test chưa tạo báo cáo cuối.", toasts: { signInRequired: "Vui lòng đăng nhập để xem báo cáo", loadFailed: "Không thể tải báo cáo" } },
    },
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || "en");

  const setLanguage = (nextLanguage) => {
    const normalized = nextLanguage === "vi" ? "vi" : "en";
    localStorage.setItem(STORAGE_KEY, normalized);
    setLanguageState(normalized);
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: translations[language] || translations.en,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function useT(namespace) {
  return useLanguage().t[namespace];
}
