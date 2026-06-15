export const navbarT = {
  "links": [
    {
      "label": "Features",
      "href": "#features"
    },
    {
      "label": "How it works",
      "href": "#how"
    },
    {
      "label": "FAQ",
      "href": "#faq"
    }
  ],
  "pricing": "Pricing",
  "workspace": "Workspace",
  "yourAccount": "Your account",
  "profile": "Profile",
  "accountSettings": "Account settings",
  "signOut": "Sign out",
  "signIn": "Sign in",
  "start": "Start",
  "loggedOut": "Logged out successfully!",
  "language": "Language"
};

export const heroT = {
  "badge": "v2.4 — AI Test Authoring",
  "headline1": "Ship faster.",
  "headline2": "With",
  "highlight": "zero bugs",
  "subtitle": "TestPilot is the autonomous QA platform that writes, runs, and maintains your end-to-end tests. Catch regressions across every browser before they hit production.",
  "primaryCta": "Start testing",
  "secondaryCta": "Watch 2-min demo",
  "benefits": [
    "No credit card",
    "14-day free trial",
    "Cancel anytime"
  ],
  "statLabels": {
    "tests": "Tests",
    "passed": "Passed",
    "duration": "Duration"
  },
  "liveRun": "Live run",
  "checkoutFlow": "Checkout flow — Chrome",
  "passing": "PASSING",
  "aiAuthor": "AI Author",
  "generated": "Generated 12 tests"
};

export const featuresT = {
  "header": {
    "label": "Capabilities",
    "title": "Everything you need to ship confidently.",
    "subtitle": "From AI-generated test cases to pixel-perfect visual diffs, TestPilot covers every layer of quality assurance."
  },
  "cards": [
    {
      "title": "AI-authored E2E tests",
      "description": "Describe a flow in plain English. TestPilot writes, runs, and self-heals tests as your UI evolves.",
      "codeComment": "// Generated from prompt"
    },
    {
      "title": "Visual regression",
      "description": "Catch one-pixel shifts. Side-by-side diffs across breakpoints with smart ignore regions."
    },
    {
      "title": "Cross-browser at scale",
      "description": "Parallel runs across Chrome, Firefox, Safari, and Edge — desktop and mobile viewports."
    },
    {
      "title": "CI/CD native",
      "description": "Drop-in actions for GitHub, GitLab and CircleCI. Block PRs that break the build."
    },
    {
      "title": "10× faster runs",
      "description": "Smart parallelization and test sharding. Full suite in under a minute."
    },
    {
      "title": "SOC 2 secure",
      "description": "Encrypted secrets, isolated runners, role-based access. Enterprise-ready out of the box."
    }
  ]
};

export const howItWorksT = {
  "header": {
    "label": "How it works",
    "title": "From zero to green builds in four moves.",
    "subtitle": "No DevOps degree required. Plug TestPilot in once and let the platform handle the rest."
  },
  "stepLabel": "Step",
  "steps": [
    {
      "title": "Connect your repo",
      "body": "One-click install for GitHub, GitLab or Bitbucket. We index your app and routes automatically."
    },
    {
      "title": "Describe what to test",
      "body": "Type a flow in plain English or import existing Playwright/Cypress specs. AI converts them in seconds."
    },
    {
      "title": "Run on every commit",
      "body": "TestPilot fires parallel jobs across browsers and devices. Failures show video, traces and DOM snapshots."
    },
    {
      "title": "Self-heal & merge",
      "body": "When selectors drift, TestPilot rewrites them. PRs ship faster — without flaky tests."
    }
  ]
};

export const pricingT = {
  "header": {
    "label": "Pricing",
    "title": "Choose Plus or pay with credits.",
    "subtitle": "Start with 2 free credits, then use a predictable monthly plan or flexible pay-as-you-go top ups."
  },
  "mostPopular": "Most popular",
  "tiers": [
    {
      "name": "Plus",
      "price": "10",
      "period": "per month",
      "desc": "For developers who test regularly and want a predictable monthly bill.",
      "features": [
        "15 standard test runs / month",
        "Optional code fix suggestions",
        "Better test generation engine",
        "Extra runs continue with credits",
        "Monthly allowance resets each billing cycle"
      ],
      "cta": "Subscribe",
      "highlighted": true
    },
    {
      "name": "Credits",
      "price": "1",
      "period": "per credit",
      "desc": "For occasional testing, larger runs, or usage beyond the Plus allowance.",
      "features": [
        "$1 per credit",
        "Minimum top-up: 4 credits",
        "Credits do not expire",
        "Use credits for larger or extra runs",
        "2 free credits on signup"
      ],
      "cta": "Buy credits"
    }
  ]
};

export const testimonialsT = {
  "header": {
    "label": "Trusted by builders",
    "title": "Teams that hate broken builds, love TestPilot."
  },
  "items": [
    {
      "quote": "We cut release cycles from two weeks to two days. TestPilot's self-healing tests just don't break anymore — even on a UI overhaul.",
      "name": "Maya Patel",
      "role": "QA Lead, Northwind"
    },
    {
      "quote": "Our staging caught three checkout regressions in the first week. The AI authoring saves my engineers half a day each sprint.",
      "name": "Daniel Kim",
      "role": "Head of Engineering, Loop"
    },
    {
      "quote": "Visual diffs across 12 viewports in 40 seconds. We replaced two paid tools with TestPilot and never looked back.",
      "name": "Sofia Lange",
      "role": "Frontend Director, Klear"
    }
  ],
  "stats": [
    {
      "v": "98.6%",
      "l": "Less flake"
    },
    {
      "v": "10×",
      "l": "Faster runs"
    },
    {
      "v": "4,200+",
      "l": "Teams shipping"
    },
    {
      "v": "SOC 2",
      "l": "Type II"
    }
  ]
};

export const faqT = {
  "header": {
    "label": "FAQ",
    "title": "Questions, answered."
  },
  "items": [
    {
      "q": "Do I need to write code to use TestPilot?",
      "a": "No. You can describe flows in plain English and TestPilot generates and maintains the tests for you. Power users can still write or import Playwright / Cypress specs."
    },
    {
      "q": "Which browsers and devices are supported?",
      "a": "Chrome, Firefox, Safari and Edge on desktop, plus iOS Safari and Android Chrome viewports. Tests run in parallel across all of them."
    },
    {
      "q": "How does self-healing work?",
      "a": "When a selector drifts (for example, a class name changes), TestPilot uses heuristics and a vision model to relocate the element and proposes a fix. You can auto-merge or review."
    },
    {
      "q": "Can I run TestPilot in my own CI?",
      "a": "Yes. Drop-in GitHub Actions, GitLab CI and CircleCI integrations are available. You can also trigger runs via our REST API or CLI."
    },
    {
      "q": "Is my data secure?",
      "a": "All runners are isolated, secrets are encrypted at rest, and access is role-based. We are SOC 2 Type II certified and GDPR compliant."
    },
    {
      "q": "What happens after the free trial?",
      "a": "You roll over to the Free plan automatically — no cards charged. Upgrade to Pro any time to unlock more runs and features."
    }
  ]
};

export const finalCtaT = {
  "badge": "Start in 60 seconds",
  "headline1": "Stop chasing bugs.",
  "headline2": "Start shipping.",
  "paragraph": "Join thousands of teams using TestPilot to release software with confidence — no flaky tests, no late-night rollbacks.",
  "primaryCta": "Start free — no card needed",
  "secondaryCta": "Book a demo"
};

export const footerT = {
  "tagline": "The autonomous QA platform for teams that ship every day.",
  "copyright": "© 2026 Automate, Inc. All rights reserved.",
  "builtFor": "Built for builders · v2.4.0",
  "cols": [
    {
      "title": "Product",
      "links": [
        "Features",
        "Changelog",
        "Roadmap"
      ]
    },
    {
      "title": "Company",
      "links": [
        "About",
        "Customers",
        "Contact"
      ]
    },
    {
      "title": "Resources",
      "links": [
        "Docs",
        "Blog",
        "Community"
      ]
    },
    {
      "title": "Legal",
      "links": [
        "Privacy",
        "Terms",
        "Security"
      ]
    }
  ]
};