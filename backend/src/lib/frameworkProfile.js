'use strict';

const PROFILES = {
  'Next.js': {
    name: 'Next.js',
    auth_url: '/api/auth/signin OR /login OR /signin',
    route_convention: 'File-based routing: pages/ or app/ directory. Each file = one route.',
    testid_convention: 'Use data-testid when available; fallback to id or short CSS class.',
    global_layout_files: ['_app.tsx', '_app.jsx', 'layout.tsx', 'layout.jsx'],
    notes: 'SSR/SSG — wait for hydration. Prefer waitForLoadState("networkidle") before assertions.',
  },
  'Vite': {
    name: 'Vite + React',
    auth_url: '/signin OR /login',
    route_convention: 'React Router v6 defined in src/App.tsx or src/router/. SPA — all navigation via page.goto().',
    testid_convention: 'data-testid rarely added; prefer CSS class or id selectors from interactive_elements.',
    global_layout_files: ['App.jsx', 'App.tsx', 'main.jsx', 'main.tsx'],
    notes: 'SPA routing — never use anchor clicks for cross-route navigation; always page.goto().',
  },
  'Create React App': {
    name: 'Create React App',
    auth_url: '/login OR /signin',
    route_convention: 'React Router defined in src/App.js. SPA.',
    testid_convention: 'data-testid is common in CRA projects.',
    global_layout_files: ['App.js', 'App.tsx'],
    notes: 'SPA — use page.goto() for all route navigation.',
  },
  'Vue': {
    name: 'Vue.js',
    auth_url: '/login',
    route_convention: 'Vue Router in src/router/index.js. SPA.',
    testid_convention: 'data-testid or ref attributes. Vue scoped CSS may change class names.',
    global_layout_files: ['App.vue', 'main.js', 'main.ts'],
    notes: 'Vue reactivity may delay DOM updates — always use toBeVisible() with a timeout.',
  },
  'Nuxt': {
    name: 'Nuxt.js',
    auth_url: '/login',
    route_convention: 'File-based routing in pages/ or app/. Layouts in layouts/.',
    testid_convention: 'data-testid common. Scoped CSS may alter class names.',
    global_layout_files: ['layouts/default.vue', 'app.vue'],
    notes: 'SSR/SSG — use waitForLoadState("networkidle") before assertions.',
  },
  'Angular': {
    name: 'Angular',
    auth_url: '/login OR /auth/login',
    route_convention: 'RouterModule.forRoot() defined in app-routing.module.ts.',
    testid_convention: 'data-testid or data-cy common in Angular E2E setups.',
    global_layout_files: ['app.component.ts', 'app.component.html'],
    notes: 'Zone.js change detection — use waitForSelector after interactions.',
  },
  'SvelteKit': {
    name: 'SvelteKit',
    auth_url: '/login',
    route_convention: 'File-based routing in src/routes/. +page.svelte = route component.',
    testid_convention: 'data-testid common.',
    global_layout_files: ['+layout.svelte'],
    notes: 'File-based routing. SSR possible — wait for hydration.',
  },
  'Express': {
    name: 'Express (Backend only)',
    auth_url: '/api/login OR /api/auth',
    route_convention: 'REST API — no frontend routing. Use request fixture for API tests.',
    testid_convention: 'N/A — API testing only.',
    global_layout_files: [],
    notes: 'No browser UI. Use Playwright request context for API tests.',
  },
};

/**
 * Build a framework profile from detector infrastructure data.
 * Returns null if no frontend project is found.
 */
function buildFrameworkProfile(infrastructure) {
  if (!infrastructure) return null;

  const projects = Array.isArray(infrastructure.projects) ? infrastructure.projects : [];
  const frontend = projects.find(p => p.type === 'frontend');
  const backend  = projects.find(p => p.type === 'backend');

  const rawFramework = (
    frontend?.run_config?.framework ||
    frontend?.framework ||
    backend?.run_config?.framework ||
    ''
  );

  const profile = matchProfile(rawFramework) || defaultProfile(rawFramework);
  profile.detected_framework = rawFramework || 'Unknown';
  profile.has_backend = !!backend;
  profile.backend_framework = backend?.run_config?.framework || backend?.framework || null;

  return profile;
}

function matchProfile(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const [key, profile] of Object.entries(PROFILES)) {
    if (lower.includes(key.toLowerCase())) return { ...profile };
  }
  return null;
}

function defaultProfile(raw) {
  return {
    name: raw || 'Unknown',
    auth_url: '/login OR /signin',
    route_convention: 'Inspect App entry file to determine routing setup.',
    testid_convention: 'Prefer data-testid > id > short CSS class. Avoid deep nesting.',
    global_layout_files: ['App.jsx', 'App.tsx', 'App.vue', 'app.component.ts'],
    notes: 'Unknown framework — generate conservative smoke/interaction tests. Avoid invented selectors.',
  };
}

/**
 * Format a profile as a concise prompt hint string.
 */
function formatProfileForPrompt(profile) {
  if (!profile) return '';
  const lines = [
    `Framework: ${profile.name} (detected: ${profile.detected_framework})`,
    `Auth URL pattern: ${profile.auth_url}`,
    `Routing convention: ${profile.route_convention}`,
    `Selector convention: ${profile.testid_convention}`,
    `Notes: ${profile.notes}`,
  ];
  if (profile.has_backend && profile.backend_framework) {
    lines.push(`Backend: ${profile.backend_framework}`);
  }
  return lines.join('\n');
}

module.exports = { buildFrameworkProfile, formatProfileForPrompt };
