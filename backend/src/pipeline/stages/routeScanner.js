'use strict';

const fs   = require('fs');
const path = require('path');

// ── Babel (optional – graceful fallback to regex if missing) ─────────────────
let babelParser, babelTraverse;
try {
  babelParser   = require('@babel/parser');
  babelTraverse = require('@babel/traverse').default;
} catch {
  // fallback to regex extraction
}

// ── Constants ────────────────────────────────────────────────────────────────

const AUTH_WRAPPERS = new Set([
  'ProtectedRoute', 'PrivateRoute', 'AuthGuard', 'RequireAuth',
  'AuthenticatedRoute', 'AuthRoute', 'SecureRoute', 'GuardedRoute',
  'WithAuth', 'Authenticated',
]);

const ADMIN_AUTH_PROPS = new Set(['adminOnly', 'admin', 'isAdmin']);

// Content-level heuristics that identify a file as a routing definition file
const ROUTING_CONTENT_PATTERNS = [
  /<Route[\s/]/,
  /<Routes>/,
  /createBrowserRouter\s*\(/,
  /createHashRouter\s*\(/,
  /createMemoryRouter\s*\(/,
  /useRoutes\s*\(/,
  /RouterModule\.forRoot\s*\(/,  // Angular
  /createRouter\s*\(/,           // Vue Router
];

// File-based routing directory names (Next.js, Nuxt, SvelteKit)
const FILE_BASED_ROUTING_DIRS = ['pages', 'app', 'src/routes'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function isRoutingFile(content) {
  return ROUTING_CONTENT_PATTERNS.some(p => p.test(content));
}

/** Return the JSXIdentifier name of a JSXElement, or null. */
function jsxName(node) {
  if (!node || node.type !== 'JSXElement') return null;
  const { name } = node.openingElement;
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression') {
    return `${name.object.name}.${name.property.name}`;
  }
  return null;
}

/** Given a <Route element={…}> expression node, return { component, requires_auth, auth_role }. */
function resolveElementProp(exprNode) {
  if (!exprNode || exprNode.type !== 'JSXElement') {
    return { component: null, requires_auth: false, auth_role: null };
  }

  const outerName = jsxName(exprNode);

  // Outer element is an auth wrapper
  if (outerName && AUTH_WRAPPERS.has(outerName)) {
    // Detect admin role from props
    const attrs = exprNode.openingElement.attributes || [];
    const isAdmin = attrs.some(
      a => a.type === 'JSXAttribute' && ADMIN_AUTH_PROPS.has(a.name && a.name.name),
    );

    // Inner page component = first JSXElement child with uppercase name
    const inner = (exprNode.children || []).find(
      c => c.type === 'JSXElement' && /^[A-Z]/.test(jsxName(c) || ''),
    );

    return {
      component: inner ? jsxName(inner) : null,
      requires_auth: true,
      auth_role: isAdmin ? 'admin' : null,
    };
  }

  // Plain component
  if (outerName && /^[A-Z]/.test(outerName)) {
    return { component: outerName, requires_auth: false, auth_role: null };
  }

  return { component: null, requires_auth: false, auth_role: null };
}

// ── AST-based extraction ──────────────────────────────────────────────────────

/**
 * Parse JSX Route elements and global layout components from an AST.
 * Returns { routes: RouteEntry[], globalComponents: Set<string> }
 */
function extractFromAST(ast) {
  const routes          = [];
  const globalComponents = new Set();
  let   routesDepth     = 0;   // depth inside <Routes> blocks

  babelTraverse(ast, {
    JSXElement: {
      enter(nodePath) {
        const name = jsxName(nodePath.node);

        // ── Track <Routes> depth ────────────────────────────────────────────
        if (name === 'Routes') {
          routesDepth++;
          return;
        }

        // ── Handle <Route path="…" element={…}> ────────────────────────────
        if (name === 'Route') {
          const attrs = nodePath.node.openingElement.attributes || [];
          let routePath    = null;
          let component    = null;
          let requiresAuth = false;
          let authRole     = null;

          for (const attr of attrs) {
            if (attr.type !== 'JSXAttribute') continue;
            const attrName = attr.name && attr.name.name;

            if (attrName === 'path' && attr.value) {
              if (attr.value.type === 'StringLiteral') {
                routePath = attr.value.value;
              }
            }

            if (attrName === 'element' && attr.value) {
              const exprNode =
                attr.value.type === 'JSXExpressionContainer'
                  ? attr.value.expression
                  : null;
              if (exprNode) {
                const resolved = resolveElementProp(exprNode);
                component    = resolved.component;
                requiresAuth = resolved.requires_auth;
                authRole     = resolved.auth_role;
              }
            }

            // React Router v5: component={ComponentName}
            if (attrName === 'component' && attr.value) {
              const expr =
                attr.value.type === 'JSXExpressionContainer'
                  ? attr.value.expression
                  : null;
              if (expr && expr.type === 'Identifier') {
                component = expr.name;
              }
            }
          }

          if (routePath && component) {
            routes.push({ path: routePath, component, requires_auth: requiresAuth, auth_role: authRole });
          }

          // Don't traverse into Route children — elements were already handled
          nodePath.skip();
          return;
        }

        // ── Track global layout components (outside <Routes>) ───────────────
        if (
          routesDepth === 0 &&
          name &&
          /^[A-Z]/.test(name) &&
          !['BrowserRouter', 'HashRouter', 'MemoryRouter', 'Router'].includes(name)
        ) {
          globalComponents.add(name);
        }
      },

      exit(nodePath) {
        if (jsxName(nodePath.node) === 'Routes') {
          routesDepth = Math.max(0, routesDepth - 1);
        }
      },
    },

    // ── createBrowserRouter / Vue Router object config ─────────────────────
    ObjectExpression(nodePath) {
      const props = nodePath.node.properties || [];
      let routePath    = null;
      let component    = null;
      let requiresAuth = false;
      let authRole     = null;

      for (const prop of props) {
        if (prop.type !== 'ObjectProperty') continue;
        const key = prop.key.name || prop.key.value;

        if (key === 'path' && prop.value.type === 'StringLiteral') {
          routePath = prop.value.value;
        }

        if ((key === 'element' || key === 'component') && prop.value) {
          if (prop.value.type === 'JSXElement') {
            const resolved = resolveElementProp(prop.value);
            component    = resolved.component;
            requiresAuth = resolved.requires_auth;
            authRole     = resolved.auth_role;
          } else if (prop.value.type === 'Identifier') {
            component = prop.value.name;
          }
        }
      }

      if (routePath && component) {
        routes.push({ path: routePath, component, requires_auth: requiresAuth, auth_role: authRole });
      }
    },
  });

  return { routes, globalComponents };
}

// ── Regex fallback ───────────────────────────────────────────────────────────

function extractByRegex(content) {
  const routes = [];
  // <Route path="/foo" element={<ComponentName ...>}
  const re = /<Route[^>]*\spath=["']([^"']+)["'][^>]*element=\{<([A-Z][a-zA-Z0-9_]*)[\s/>]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    routes.push({ path: m[1], component: m[2], requires_auth: false, auth_role: null });
  }
  return routes;
}

// ── File-based routing (Next.js / Nuxt / SvelteKit) ─────────────────────────

// Only frontend component extensions qualify for file-based routing
const FRONTEND_EXTS = new Set(['.jsx', '.tsx', '.vue', '.svelte']);

function detectFileBasedRouting(workspaceDir, sourceFiles) {
  const routes = [];

  for (const fileInfo of sourceFiles) {
    // Skip non-frontend files (e.g. Express route .js files)
    if (!FRONTEND_EXTS.has(path.extname(fileInfo.file_name).toLowerCase())) continue;

    const normalized = fileInfo.file_path.replace(/\\/g, '/');

    for (const dir of FILE_BASED_ROUTING_DIRS) {
      const marker = `/${dir}/`;
      const idx    = normalized.indexOf(marker);
      if (idx === -1 && !normalized.startsWith(`${dir}/`)) continue;

      const afterDir =
        idx >= 0 ? normalized.slice(idx + marker.length) : normalized.slice(dir.length + 1);

      // Convert file path → URL — add '/' exactly once
      const routeSegment = afterDir
        .replace(/\.(jsx?|tsx?|vue|svelte)$/, '')
        .replace(/\/index$/, '')
        .replace(/\[([^\]]+)\]/g, ':$1')   // [id] → :id
        .replace(/\(([^)]+)\)\//g, '')      // (group)/ → remove
        .replace(/^\/+/, '');              // strip any accidental leading slash

      const routePath = routeSegment === '' ? '/' : `/${routeSegment}`;

      const baseName     = path.parse(fileInfo.file_name).name;
      const componentName =
        baseName === 'index'
          ? path.basename(path.dirname(fileInfo.file_path))
          : baseName;

      const requiresAuth =
        /profile|account|dashboard|admin|settings/.test(routePath);
      const authRole = /admin/.test(routePath) ? 'admin' : null;

      routes.push({
        path: routePath,
        component: componentName,
        requires_auth: requiresAuth,
        auth_role: authRole,
        source: 'file-based',
      });
      break;
    }
  }

  return routes;
}

// ── Import inheritance (sub-component → parent page route) ──────────────────

/**
 * For routed page components, scan their source files for imported sub-components
 * so that e.g. ProfileSidebar (used inside ProfilePage) inherits route /profile.
 */
function buildInheritanceMap(directMap, sourceFiles, workspaceDir) {
  const inherited  = {};
  // basename → file_path  (for resolving imports)
  const nameToPath = {};
  for (const f of sourceFiles) {
    nameToPath[path.parse(f.file_name).name] = f.file_path;
  }

  for (const [pageName, ctx] of Object.entries(directMap)) {
    if (ctx.is_global_layout) continue;

    const srcPath = nameToPath[pageName];
    if (!srcPath) continue;

    let content;
    try {
      content = fs.readFileSync(path.join(workspaceDir, srcPath), 'utf-8');
    } catch {
      continue;
    }

    // Match: import X / import { X } / import { X as Y } from './path'
    const importRe =
      /import\s+(?:\{([^}]+)\}|([A-Z][a-zA-Z0-9_]*))\s+from\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRe.exec(content)) !== null) {
      const importPath = m[3];
      if (!importPath.startsWith('.')) continue; // skip node_modules

      // Collect all component names from this import statement
      const names = [];
      if (m[1]) {
        // named imports: { A, B as C }
        for (const part of m[1].split(',')) {
          const clean = part.trim().split(/\s+as\s+/).pop().trim();
          if (/^[A-Z]/.test(clean)) names.push(clean);
        }
      } else if (m[2]) {
        names.push(m[2]);
      }

      for (const subName of names) {
        if (directMap[subName] || inherited[subName]) continue; // already mapped
        inherited[subName] = {
          rendered_at:      ctx.rendered_at,
          requires_auth:    ctx.requires_auth,
          auth_role:        ctx.auth_role,
          is_global_layout: false,
          inherited_from:   pageName,
        };
      }
    }
  }

  return inherited;
}

// ── JSX usage scan (standalone components not found via import) ───────────────

/**
 * Some components (e.g. ProductCard defined inline in a page, or Footer used
 * without explicit import) are only discoverable by scanning JSX usage across
 * all source files.  For each known component name that still lacks a route,
 * scan every source file for `<ComponentName` and inherit from the file's owner.
 */
function buildJSXUsageMap(knownMap, sourceFiles, workspaceDir) {
  // Build set of component basenames from source files
  const componentBasenames = new Set(sourceFiles.map(f => path.parse(f.file_name).name));
  const nameToPath = {};
  for (const f of sourceFiles) nameToPath[path.parse(f.file_name).name] = f.file_path;

  const usageMap = {};

  for (const fileInfo of sourceFiles) {
    // Only scan files that belong to a routed context
    const ownerName = path.parse(fileInfo.file_name).name;
    const ownerCtx  = knownMap[ownerName];
    if (!ownerCtx || ownerCtx.is_global_layout) continue;
    if (ownerCtx.rendered_at.length === 0) continue;

    let content;
    try {
      content = fs.readFileSync(path.join(workspaceDir, fileInfo.file_path), 'utf-8');
    } catch {
      continue;
    }

    // Find <ComponentName patterns in JSX
    const jsxUsageRe = /<([A-Z][a-zA-Z0-9_]*)[\s/>]/g;
    let m;
    while ((m = jsxUsageRe.exec(content)) !== null) {
      const compName = m[1];
      // Only care about names that correspond to actual source files
      if (!componentBasenames.has(compName)) continue;
      if (knownMap[compName] || usageMap[compName]) continue; // already mapped
      usageMap[compName] = {
        rendered_at:      ownerCtx.rendered_at,
        requires_auth:    ownerCtx.requires_auth,
        auth_role:        ownerCtx.auth_role,
        is_global_layout: false,
        inherited_from:   ownerName,
      };
    }
  }

  return usageMap;
}

// ── Main entry point ─────────────────────────────────────────────────────────

/**
 * Scan all source files and return a route context map.
 *
 * @param {Array<{file_name, file_path, language}>} sourceFiles
 * @param {string} workspaceDir  absolute path to the project root
 * @returns {Object.<string, {rendered_at: string[], requires_auth: boolean, auth_role: string|null, is_global_layout: boolean}>}
 */
function scanRoutes(sourceFiles, workspaceDir) {
  const allRoutes        = [];
  const globalComponents = new Set();

  // ── Pass 1: Scan routing definition files ──────────────────────────────────
  for (const fileInfo of sourceFiles) {
    const fullPath = path.join(workspaceDir, fileInfo.file_path);
    let content;
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }

    if (!isRoutingFile(content)) continue;

    if (babelParser && babelTraverse) {
      try {
        const ast = babelParser.parse(content, {
          sourceType:    'module',
          plugins:       ['jsx', 'typescript'],
          errorRecovery: true,
        });
        const { routes, globalComponents: gc } = extractFromAST(ast);
        allRoutes.push(...routes);
        gc.forEach(c => globalComponents.add(c));
      } catch {
        allRoutes.push(...extractByRegex(content));
      }
    } else {
      allRoutes.push(...extractByRegex(content));
    }
  }

  // ── Pass 2: File-based routing — only for projects WITHOUT explicit routing ──
  // If AST extraction already found routes, this is a React Router / Vue Router
  // project and file-based detection would produce duplicates/noise.
  if (allRoutes.length === 0) {
    allRoutes.push(...detectFileBasedRouting(workspaceDir, sourceFiles));
  }

  // ── Pass 3: Build direct component → RouteContext map ──────────────────────
  const directMap = {};

  for (const { path: routePath, component, requires_auth, auth_role } of allRoutes) {
    if (!component || !routePath) continue;
    if (!directMap[component]) {
      directMap[component] = {
        rendered_at:      [],
        requires_auth:    false,
        auth_role:        null,
        is_global_layout: false,
      };
    }
    const ctx = directMap[component];
    if (!ctx.rendered_at.includes(routePath)) ctx.rendered_at.push(routePath);
    if (requires_auth) ctx.requires_auth = true;
    if (auth_role && !ctx.auth_role)         ctx.auth_role  = auth_role;
  }

  // Mark global layout components
  for (const comp of globalComponents) {
    if (!directMap[comp]) {
      directMap[comp] = { rendered_at: ['*'], requires_auth: false, auth_role: null, is_global_layout: true };
    } else {
      directMap[comp].rendered_at      = ['*'];
      directMap[comp].is_global_layout = true;
    }
  }

  // ── Pass 4: Inheritance — sub-components inherit parent page routes ─────────
  const inheritedMap = buildInheritanceMap(directMap, sourceFiles, workspaceDir);
  const afterInheritance = { ...inheritedMap, ...directMap }; // directMap wins

  // ── Pass 5: JSX usage scan — catch components not found via imports ──────────
  const jsxUsageMap = buildJSXUsageMap(afterInheritance, sourceFiles, workspaceDir);
  const finalMap    = { ...jsxUsageMap, ...afterInheritance }; // explicit wins

  console.log(
    `[RouteScanner] Found ${Object.keys(finalMap).length} component contexts` +
    ` (${allRoutes.length} routes, ${globalComponents.size} global layouts)`,
  );

  return finalMap;
}

module.exports = { scanRoutes };
