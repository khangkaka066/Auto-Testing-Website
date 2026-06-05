export const navbarT = {
  en: {
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "FAQ", href: "#faq" },
    ],
    pricing: "Pricing",
    workspace: "Workspace",
    yourAccount: "Your account",
    profile: "Profile",
    accountSettings: "Account settings",
    signOut: "Sign out",
    signIn: "Sign in",
    start: "Start",
    loggedOut: "Logged out successfully!",
  },
  vi: {
    links: [
      { label: "Tính năng", href: "#features" },
      { label: "Cách hoạt động", href: "#how" },
      { label: "FAQ", href: "#faq" },
    ],
    pricing: "Bảng giá",
    workspace: "Không gian làm việc",
    yourAccount: "Tài khoản của bạn",
    profile: "Hồ sơ",
    accountSettings: "Cài đặt tài khoản",
    signOut: "Đăng xuất",
    signIn: "Đăng nhập",
    start: "Bắt đầu",
    loggedOut: "Đã đăng xuất thành công!",
  },
};

export const heroT = {
  en: {
    badge: "v2.4 — AI Test Authoring",
    headline1: "Ship faster.",
    headline2: "With",
    highlight: "zero bugs",
    subtitle:
      "TestPilot is the autonomous QA platform that writes, runs, and maintains your end-to-end tests. Catch regressions across every browser before they hit production.",
    primaryCta: "Start testing",
    secondaryCta: "Watch 2-min demo",
    benefits: ["No credit card", "14-day free trial", "Cancel anytime"],
    statLabels: { tests: "Tests", passed: "Passed", duration: "Duration" },
    liveRun: "Live run",
    checkoutFlow: "Checkout flow — Chrome",
    passing: "PASSING",
    aiAuthor: "AI Author",
    generated: "Generated 12 tests",
  },
  vi: {
    badge: "v2.4 — Tạo Test bằng AI",
    headline1: "Ra mắt nhanh hơn.",
    headline2: "Với",
    highlight: "không có lỗi",
    subtitle:
      "TestPilot là nền tảng QA tự động viết, chạy và duy trì các bài kiểm thử end-to-end. Phát hiện lỗi hồi quy trên mọi trình duyệt trước khi đến tay người dùng.",
    primaryCta: "Bắt đầu kiểm thử",
    secondaryCta: "Xem demo 2 phút",
    benefits: ["Không cần thẻ tín dụng", "Dùng thử 14 ngày", "Hủy bất cứ lúc nào"],
    statLabels: { tests: "Kiểm thử", passed: "Đạt", duration: "Thời gian" },
    liveRun: "Chạy trực tiếp",
    checkoutFlow: "Luồng thanh toán — Chrome",
    passing: "ĐẠT",
    aiAuthor: "AI Tạo Test",
    generated: "Đã tạo 12 bài kiểm thử",
  },
};

export const featuresT = {
  en: {
    header: {
      label: "Capabilities",
      title: "Everything you need to ship confidently.",
      subtitle:
        "From AI-generated test cases to pixel-perfect visual diffs, TestPilot covers every layer of quality assurance.",
    },
    cards: [
      {
        title: "AI-authored E2E tests",
        description:
          "Describe a flow in plain English. TestPilot writes, runs, and self-heals tests as your UI evolves.",
        codeComment: "// Generated from prompt",
      },
      {
        title: "Visual regression",
        description:
          "Catch one-pixel shifts. Side-by-side diffs across breakpoints with smart ignore regions.",
      },
      {
        title: "Cross-browser at scale",
        description:
          "Parallel runs across Chrome, Firefox, Safari, and Edge — desktop and mobile viewports.",
      },
      {
        title: "CI/CD native",
        description:
          "Drop-in actions for GitHub, GitLab and CircleCI. Block PRs that break the build.",
      },
      {
        title: "10× faster runs",
        description:
          "Smart parallelization and test sharding. Full suite in under a minute.",
      },
      {
        title: "SOC 2 secure",
        description:
          "Encrypted secrets, isolated runners, role-based access. Enterprise-ready out of the box.",
      },
    ],
  },
  vi: {
    header: {
      label: "Tính năng",
      title: "Mọi thứ bạn cần để ra mắt tự tin.",
      subtitle:
        "Từ test case do AI tạo ra đến so sánh giao diện từng pixel, TestPilot bao phủ mọi lớp đảm bảo chất lượng.",
    },
    cards: [
      {
        title: "Kiểm thử E2E do AI viết",
        description:
          "Mô tả luồng bằng tiếng Việt. TestPilot tự viết, chạy và tự phục hồi test khi giao diện thay đổi.",
        codeComment: "// Được tạo từ mô tả",
      },
      {
        title: "Kiểm tra hồi quy giao diện",
        description:
          "Phát hiện thay đổi từng pixel. So sánh hai phiên bản trên mọi breakpoint với vùng bỏ qua thông minh.",
      },
      {
        title: "Đa trình duyệt quy mô lớn",
        description:
          "Chạy song song trên Chrome, Firefox, Safari và Edge — desktop và mobile.",
      },
      {
        title: "Tích hợp CI/CD",
        description:
          "Tích hợp nhanh cho GitHub, GitLab và CircleCI. Chặn PR phá vỡ bản build.",
      },
      {
        title: "Chạy nhanh hơn 10×",
        description:
          "Song song hóa thông minh và phân mảnh test. Toàn bộ bộ test trong chưa đầy một phút.",
      },
      {
        title: "Bảo mật chuẩn SOC 2",
        description:
          "Mã hóa bí mật, runner cô lập, kiểm soát truy cập theo vai trò. Sẵn sàng cho doanh nghiệp.",
      },
    ],
  },
};

export const howItWorksT = {
  en: {
    header: {
      label: "How it works",
      title: "From zero to green builds in four moves.",
      subtitle:
        "No DevOps degree required. Plug TestPilot in once and let the platform handle the rest.",
    },
    stepLabel: "Step",
    steps: [
      {
        title: "Connect your repo",
        body: "One-click install for GitHub, GitLab or Bitbucket. We index your app and routes automatically.",
      },
      {
        title: "Describe what to test",
        body: "Type a flow in plain English or import existing Playwright/Cypress specs. AI converts them in seconds.",
      },
      {
        title: "Run on every commit",
        body: "TestPilot fires parallel jobs across browsers and devices. Failures show video, traces and DOM snapshots.",
      },
      {
        title: "Self-heal & merge",
        body: "When selectors drift, TestPilot rewrites them. PRs ship faster — without flaky tests.",
      },
    ],
  },
  vi: {
    header: {
      label: "Cách hoạt động",
      title: "Từ con số không đến bản build xanh chỉ với bốn bước.",
      subtitle:
        "Không cần bằng DevOps. Cài TestPilot một lần và để nền tảng lo phần còn lại.",
    },
    stepLabel: "Bước",
    steps: [
      {
        title: "Kết nối kho lưu trữ",
        body: "Cài đặt một click cho GitHub, GitLab hoặc Bitbucket. Chúng tôi tự động lập chỉ mục ứng dụng và các route của bạn.",
      },
      {
        title: "Mô tả những gì cần kiểm thử",
        body: "Gõ một luồng bằng ngôn ngữ tự nhiên hoặc nhập spec Playwright/Cypress hiện có. AI chuyển đổi trong vài giây.",
      },
      {
        title: "Chạy trên mỗi commit",
        body: "TestPilot khởi chạy các job song song trên mọi trình duyệt và thiết bị. Lỗi hiển thị video, trace và snapshot DOM.",
      },
      {
        title: "Tự phục hồi & merge",
        body: "Khi selector thay đổi, TestPilot tự viết lại. PR ra mắt nhanh hơn — không còn test không ổn định.",
      },
    ],
  },
};

export const pricingT = {
  en: {
    header: {
      label: "Pricing",
      title: "Pay for runs, not for seats.",
      subtitle:
        "Simple plans that grow with your team. No surprise overage fees, ever.",
    },
    mostPopular: "Most popular",
    tiers: [
      {
        name: "Free",
        price: "0",
        period: "forever",
        desc: "Perfect for solo developers and side projects.",
        features: [
          "500 test runs / month",
          "1 user, 1 project",
          "Community support",
          "Chrome only",
        ],
        cta: "Start free",
      },
      {
        name: "Pro",
        price: "49",
        period: "per month",
        desc: "For teams that ship to production every day.",
        features: [
          "25,000 test runs / month",
          "Unlimited projects",
          "All browsers & mobile viewports",
          "AI test authoring & self-healing",
          "GitHub, GitLab, Slack integrations",
          "Priority support",
        ],
        cta: "Start 14-day trial",
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "annual contract",
        desc: "Compliance, SSO and dedicated infrastructure.",
        features: [
          "Unlimited test runs",
          "SSO/SAML, SCIM, audit logs",
          "Dedicated runners & region",
          "SOC 2 Type II report",
          "Custom SLA & onboarding",
        ],
        cta: "Talk to sales",
      },
    ],
  },
  vi: {
    header: {
      label: "Bảng giá",
      title: "Trả tiền theo lượt chạy, không theo số người dùng.",
      subtitle:
        "Gói dịch vụ đơn giản tăng trưởng cùng đội nhóm. Không có phí vượt mức bất ngờ.",
    },
    mostPopular: "Phổ biến nhất",
    tiers: [
      {
        name: "Miễn phí",
        price: "0",
        period: "mãi mãi",
        desc: "Hoàn hảo cho lập trình viên cá nhân và dự án phụ.",
        features: [
          "500 lượt chạy test / tháng",
          "1 người dùng, 1 dự án",
          "Hỗ trợ cộng đồng",
          "Chỉ Chrome",
        ],
        cta: "Bắt đầu miễn phí",
      },
      {
        name: "Pro",
        price: "49",
        period: "mỗi tháng",
        desc: "Dành cho đội nhóm ra mắt sản phẩm mỗi ngày.",
        features: [
          "25.000 lượt chạy test / tháng",
          "Không giới hạn dự án",
          "Tất cả trình duyệt & viewport mobile",
          "Tạo test & tự phục hồi bằng AI",
          "Tích hợp GitHub, GitLab, Slack",
          "Hỗ trợ ưu tiên",
        ],
        cta: "Dùng thử 14 ngày",
        highlighted: true,
      },
      {
        name: "Doanh nghiệp",
        price: "Liên hệ",
        period: "hợp đồng năm",
        desc: "Tuân thủ, SSO và cơ sở hạ tầng riêng.",
        features: [
          "Không giới hạn lượt chạy test",
          "SSO/SAML, SCIM, nhật ký kiểm toán",
          "Runner & khu vực riêng",
          "Báo cáo SOC 2 Type II",
          "SLA & onboarding tùy chỉnh",
        ],
        cta: "Liên hệ bán hàng",
      },
    ],
  },
};

export const testimonialsT = {
  en: {
    header: {
      label: "Trusted by builders",
      title: "Teams that hate broken builds, love TestPilot.",
    },
    items: [
      {
        quote:
          "We cut release cycles from two weeks to two days. TestPilot's self-healing tests just don't break anymore — even on a UI overhaul.",
        name: "Maya Patel",
        role: "QA Lead, Northwind",
      },
      {
        quote:
          "Our staging caught three checkout regressions in the first week. The AI authoring saves my engineers half a day each sprint.",
        name: "Daniel Kim",
        role: "Head of Engineering, Loop",
      },
      {
        quote:
          "Visual diffs across 12 viewports in 40 seconds. We replaced two paid tools with TestPilot and never looked back.",
        name: "Sofia Lange",
        role: "Frontend Director, Klear",
      },
    ],
    stats: [
      { v: "98.6%", l: "Less flake" },
      { v: "10×", l: "Faster runs" },
      { v: "4,200+", l: "Teams shipping" },
      { v: "SOC 2", l: "Type II" },
    ],
  },
  vi: {
    header: {
      label: "Được tin dùng bởi các lập trình viên",
      title: "Những đội ghét build lỗi đều yêu thích TestPilot.",
    },
    items: [
      {
        quote:
          "Chúng tôi rút ngắn chu kỳ phát hành từ hai tuần xuống còn hai ngày. Test tự phục hồi của TestPilot không còn bị lỗi — kể cả khi cải tổ toàn bộ giao diện.",
        name: "Maya Patel",
        role: "QA Lead, Northwind",
      },
      {
        quote:
          "Staging của chúng tôi phát hiện ba lỗi hồi quy thanh toán trong tuần đầu. Tính năng tạo test AI tiết kiệm cho kỹ sư nửa ngày mỗi sprint.",
        name: "Daniel Kim",
        role: "Trưởng nhóm Kỹ thuật, Loop",
      },
      {
        quote:
          "So sánh giao diện trên 12 viewport trong 40 giây. Chúng tôi thay thế hai công cụ trả phí bằng TestPilot và không nhìn lại.",
        name: "Sofia Lange",
        role: "Giám đốc Frontend, Klear",
      },
    ],
    stats: [
      { v: "98.6%", l: "Ít lỗi hơn" },
      { v: "10×", l: "Chạy nhanh hơn" },
      { v: "4.200+", l: "Đội đang ship" },
      { v: "SOC 2", l: "Type II" },
    ],
  },
};

export const faqT = {
  en: {
    header: { label: "FAQ", title: "Questions, answered." },
    items: [
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
    ],
  },
  vi: {
    header: { label: "FAQ", title: "Câu hỏi thường gặp." },
    items: [
      {
        q: "Tôi có cần biết viết code để dùng TestPilot không?",
        a: "Không. Bạn có thể mô tả luồng bằng ngôn ngữ tự nhiên và TestPilot tự tạo và duy trì test cho bạn. Người dùng nâng cao vẫn có thể viết hoặc nhập spec Playwright/Cypress.",
      },
      {
        q: "Những trình duyệt và thiết bị nào được hỗ trợ?",
        a: "Chrome, Firefox, Safari và Edge trên desktop, cộng thêm viewport iOS Safari và Android Chrome. Test chạy song song trên tất cả.",
      },
      {
        q: "Tính năng tự phục hồi hoạt động như thế nào?",
        a: "Khi selector thay đổi (ví dụ tên class thay đổi), TestPilot dùng heuristics và mô hình thị giác để tìm lại phần tử và đề xuất sửa. Bạn có thể tự động merge hoặc xem xét.",
      },
      {
        q: "Tôi có thể chạy TestPilot trong CI riêng của mình không?",
        a: "Có. Tích hợp GitHub Actions, GitLab CI và CircleCI đã sẵn sàng. Bạn cũng có thể kích hoạt chạy qua REST API hoặc CLI.",
      },
      {
        q: "Dữ liệu của tôi có an toàn không?",
        a: "Tất cả runner được cô lập, bí mật được mã hóa khi lưu trữ và truy cập theo vai trò. Chúng tôi được chứng nhận SOC 2 Type II và tuân thủ GDPR.",
      },
      {
        q: "Điều gì xảy ra sau khi hết thời gian dùng thử miễn phí?",
        a: "Bạn tự động chuyển sang gói Miễn phí — không tính phí thẻ. Nâng cấp lên Pro bất cứ lúc nào để mở khóa thêm lượt chạy và tính năng.",
      },
    ],
  },
};

export const finalCtaT = {
  en: {
    badge: "Start in 60 seconds",
    headline1: "Stop chasing bugs.",
    headline2: "Start shipping.",
    paragraph:
      "Join thousands of teams using TestPilot to release software with confidence — no flaky tests, no late-night rollbacks.",
    primaryCta: "Start free — no card needed",
    secondaryCta: "Book a demo",
  },
  vi: {
    badge: "Bắt đầu trong 60 giây",
    headline1: "Ngừng săn lỗi.",
    headline2: "Bắt đầu ship.",
    paragraph:
      "Tham gia cùng hàng nghìn đội đang dùng TestPilot để phát hành phần mềm tự tin — không có test không ổn định, không còn rollback lúc nửa đêm.",
    primaryCta: "Bắt đầu miễn phí — không cần thẻ",
    secondaryCta: "Đặt lịch demo",
  },
};

export const footerT = {
  en: {
    tagline: "The autonomous QA platform for teams that ship every day.",
    copyright: `© ${new Date().getFullYear()} TestPilot, Inc. All rights reserved.`,
    builtFor: "Built for builders · v2.4.0",
    cols: [
      { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog", "Roadmap"] },
      { title: "Company", links: ["About", "Customers", "Careers", "Press kit", "Contact"] },
      { title: "Resources", links: ["Docs", "API reference", "Blog", "Community", "Status"] },
      { title: "Legal", links: ["Privacy", "Terms", "Security", "SOC 2", "DPA"] },
    ],
  },
  vi: {
    tagline: "Nền tảng QA tự động cho đội nhóm ship sản phẩm mỗi ngày.",
    copyright: `© ${new Date().getFullYear()} TestPilot, Inc. Bảo lưu mọi quyền.`,
    builtFor: "Xây dựng cho lập trình viên · v2.4.0",
    cols: [
      { title: "Sản phẩm", links: ["Tính năng", "Bảng giá", "Tích hợp", "Nhật ký thay đổi", "Lộ trình"] },
      { title: "Công ty", links: ["Về chúng tôi", "Khách hàng", "Tuyển dụng", "Bộ báo chí", "Liên hệ"] },
      { title: "Tài nguyên", links: ["Tài liệu", "API reference", "Blog", "Cộng đồng", "Trạng thái"] },
      { title: "Pháp lý", links: ["Bảo mật", "Điều khoản", "Bảo mật", "SOC 2", "DPA"] },
    ],
  },
};
