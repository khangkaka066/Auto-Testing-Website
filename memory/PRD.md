# PRD — TestPilot Landing Page

## Original Problem Statement
Build a landing page: for website testing auto website

## User Choices
- Product name: **TestPilot**
- Visual style: Clean & minimal light theme (SaaS)
- Backend: Static landing only (no backend required)
- Integrations: None

## Architecture
- Stack: React 19 + CRA + Tailwind CSS + shadcn/ui + lucide-react + react-icons
- Single-page React route `/` rendered by `pages/Landing.jsx`
- Backend (`server.py`) unchanged — only `/api/` hello endpoint exists, not used on landing

## Design System (from design_guidelines.json)
- Archetype: Swiss & High-Contrast (developer tools)
- Primary accent: Vermilion/Tech Orange `#F97316`
- Fonts: Outfit (display), Inter (body), JetBrains Mono (overlines/code)
- Layout: Bento grids, 1px slate borders, dark code blocks for contrast

## Implemented Sections — 2025-12 (initial build)
- Sticky glass Navbar with mobile menu
- Hero with animated browser/run mock + AI-author floating badge
- Marquee Logo Strip (GitHub/GitLab/Jenkins/Slack/Jira/Vercel/CircleCI/Datadog/Linear/Bitbucket)
- Features bento grid (AI authoring with code snippet, visual regression, cross-browser, CI/CD, speed, security)
- How It Works (4-step grid-borders timeline)
- Pricing (Free / Pro highlighted dark / Enterprise)
- Testimonials with 4-stat metric strip
- FAQ accordion (shadcn)
- Final dark CTA section
- Footer with 4 link columns and social icons

## Backlog (next iterations)
- P1: Waitlist / Demo-request form persisted to MongoDB
- P1: Real product demo page or interactive playground
- P2: Customer case-study pages
- P2: Newsletter signup with email integration (Resend)
- P2: Animated counters and scroll-triggered reveals (framer-motion)
- P2: Pricing toggle (monthly/annual)

## Next Action Items
- Gather user feedback on copy and visuals
- Decide on backend integrations (waitlist, contact form, analytics) if/when needed
