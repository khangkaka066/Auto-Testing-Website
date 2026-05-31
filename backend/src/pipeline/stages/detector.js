const fs = require('fs');
const path = require('path');

const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue']);
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'public', '__pycache__', '.emergent', 'venv']);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function hasDep(allDeps, name) {
  return Object.prototype.hasOwnProperty.call(allDeps, name);
}

function getPackageManager(rootPath) {
  if (fs.existsSync(path.join(rootPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(rootPath, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function packageCommand(packageManager, scriptName) {
  if (packageManager === 'yarn') return `yarn ${scriptName}`;
  if (packageManager === 'pnpm') return `pnpm ${scriptName}`;
  return scriptName === 'start' ? 'npm start' : `npm run ${scriptName}`;
}

function installCommand(packageManager) {
  if (packageManager === 'yarn') return 'yarn install';
  if (packageManager === 'pnpm') return 'pnpm install';
  return 'npm install';
}

function chooseScript(scripts, candidates) {
  for (const name of candidates) {
    if (scripts[name]) return name;
  }
  return null;
}

function detectFrontendRunConfig(rootPath, pkg, allDeps, framework) {
  const scripts = pkg.scripts || {};
  const packageManager = getPackageManager(rootPath);
  const lowerScripts = Object.values(scripts).join(' ').toLowerCase();
  let port = 3000;
  let scriptName = chooseScript(scripts, ['dev', 'start', 'serve']);
  let confidence = 'medium';
  const notes = [];

  if (framework === 'Vite' || lowerScripts.includes('vite')) {
    port = 5173;
    scriptName = chooseScript(scripts, ['dev', 'start']) || scriptName;
    confidence = 'high';
  } else if (framework === 'Create React App' || lowerScripts.includes('react-scripts start')) {
    port = 3000;
    scriptName = chooseScript(scripts, ['start', 'dev']) || scriptName;
    confidence = 'high';
  } else if (framework === 'Next.js' || hasDep(allDeps, 'next')) {
    port = 3000;
    scriptName = chooseScript(scripts, ['dev', 'start']) || scriptName;
    confidence = 'high';
  } else if (framework === 'Angular' || lowerScripts.includes('ng serve')) {
    port = 4200;
    scriptName = chooseScript(scripts, ['start', 'dev']) || scriptName;
    confidence = 'high';
  } else if (framework === 'SvelteKit') {
    port = 5173;
    scriptName = chooseScript(scripts, ['dev', 'start']) || scriptName;
    confidence = 'high';
  } else if (framework === 'Astro') {
    port = 4321;
    scriptName = chooseScript(scripts, ['dev', 'start']) || scriptName;
    confidence = 'high';
  } else if (framework === 'Vue') {
    port = lowerScripts.includes('vite') ? 5173 : 8080;
    scriptName = chooseScript(scripts, ['dev', 'serve', 'start']) || scriptName;
    confidence = lowerScripts.includes('vite') ? 'high' : 'medium';
  }

  if (!scriptName) {
    notes.push('No frontend start script was detected.');
    return {
      package_manager: packageManager,
      install_command: installCommand(packageManager),
      start_command: null,
      url: null,
      port: null,
      confidence: 'low',
      notes,
    };
  }

  return {
    package_manager: packageManager,
    install_command: installCommand(packageManager),
    start_command: packageCommand(packageManager, scriptName),
    url: `http://localhost:${port}`,
    port,
    confidence,
    notes,
  };
}

function detectBackendFramework(allDeps, scripts) {
  const lowerScripts = Object.values(scripts || {}).join(' ').toLowerCase();
  if (hasDep(allDeps, '@nestjs/core') || lowerScripts.includes('nest start')) return 'NestJS';
  if (hasDep(allDeps, 'fastify')) return 'Fastify';
  if (hasDep(allDeps, 'koa')) return 'Koa';
  if (hasDep(allDeps, 'express')) return 'Express';
  if (hasDep(allDeps, 'hapi') || hasDep(allDeps, '@hapi/hapi')) return 'Hapi';
  return 'Node';
}

function detectPortFromScripts(scripts) {
  const joined = Object.values(scripts || {}).join(' ');
  const envMatch = joined.match(/(?:^|\s)(?:PORT|APP_PORT|SERVER_PORT)=(\d{2,5})(?:\s|$)/);
  if (envMatch) return Number(envMatch[1]);

  const flagMatch = joined.match(/(?:--port|-p)\s+(\d{2,5})/);
  if (flagMatch) return Number(flagMatch[1]);

  const localhostMatch = joined.match(/localhost:(\d{2,5})/);
  if (localhostMatch) return Number(localhostMatch[1]);

  return null;
}

function detectPortFromSource(rootPath, pkg) {
  const candidates = [
    pkg.main,
    'server.js',
    'src/server.js',
    'src/app.js',
    'index.js',
    'app.js',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const filePath = path.join(rootPath, candidate);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue;

    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const envFallbackMatch = content.match(/process\.env\.(?:PORT|APP_PORT|SERVER_PORT)\s*\|\|\s*(\d{2,5})/);
    if (envFallbackMatch) return Number(envFallbackMatch[1]);

    const constMatch = content.match(/(?:const|let|var)\s+(?:PORT|APP_PORT|SERVER_PORT)\s*=\s*(\d{2,5})/);
    if (constMatch) return Number(constMatch[1]);

    const listenMatch = content.match(/\.listen\(\s*(\d{2,5})/);
    if (listenMatch) return Number(listenMatch[1]);
  }

  return null;
}

function detectBackendRunConfig(rootPath, pkg, allDeps, framework) {
  const scripts = pkg.scripts || {};
  const packageManager = getPackageManager(rootPath);
  const scriptName = chooseScript(scripts, ['start', 'start:dev', 'dev', 'serve']);
  const notes = [];
  const detectedPort = detectPortFromScripts(scripts) || detectPortFromSource(rootPath, pkg);
  let port = detectedPort || 3001;
  let confidence = detectedPort ? 'high' : 'medium';

  if (framework === 'NestJS') {
    port = detectedPort || 3000;
    confidence = detectedPort ? 'high' : 'medium';
  } else if (framework === 'Express' || framework === 'Fastify' || framework === 'Koa' || framework === 'Hapi') {
    port = detectedPort || 5001;
  }

  if (!scriptName) {
    notes.push('No backend start script was detected.');
    return {
      package_manager: packageManager,
      install_command: installCommand(packageManager),
      start_command: null,
      url: null,
      port: null,
      health_path: null,
      confidence: 'low',
      notes,
    };
  }

  return {
    package_manager: packageManager,
    install_command: installCommand(packageManager),
    start_command: packageCommand(packageManager, scriptName),
    url: `http://localhost:${port}`,
    port,
    health_path: '/health',
    confidence,
    notes,
  };
}

function detectFramework(allDeps, scripts) {
  const lowerScripts = Object.values(scripts || {}).join(' ').toLowerCase();
  if (hasDep(allDeps, 'next')) return 'Next.js';
  if (hasDep(allDeps, '@angular/core') || lowerScripts.includes('ng serve')) return 'Angular';
  if (hasDep(allDeps, '@sveltejs/kit')) return 'SvelteKit';
  if (hasDep(allDeps, 'astro')) return 'Astro';
  if (hasDep(allDeps, 'react-scripts') || lowerScripts.includes('react-scripts start')) return 'Create React App';
  if (hasDep(allDeps, 'vite') || lowerScripts.includes('vite')) {
    if (hasDep(allDeps, 'react') || hasDep(allDeps, '@vitejs/plugin-react') || hasDep(allDeps, '@vitejs/plugin-react-swc')) return 'Vite';
    if (hasDep(allDeps, 'vue') || hasDep(allDeps, '@vitejs/plugin-vue')) return 'Vite';
    return 'Vite';
  }
  if (hasDep(allDeps, 'react') || hasDep(allDeps, 'react-dom')) return 'React';
  if (hasDep(allDeps, 'vue')) return 'Vue';
  return 'Vanilla JS';
}

function scanProjectFiles(rootPath) {
  const files = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          const lang = ['.ts', '.tsx'].includes(ext) ? 'TypeScript' : 'JavaScript';
          files.push({
            file_name: entry.name,
            file_path: path.relative(rootPath, fullPath).replace(/\\/g, '/'),
            language: lang,
          });
        }
      }
    }
  }

  walk(rootPath);
  return files;
}

function extractProjectMetadata(rootPath) {
  const projects = [];

  function walk(dir, depth = 0) {
    if (depth > 6) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const hasPackageJson = entries.some(e => e.isFile() && e.name === 'package.json');
    if (hasPackageJson) {
      try {
        const pkg = readJson(path.join(dir, 'package.json'));
        if (pkg) {
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          const framework = detectFramework(allDeps, pkg.scripts || {});
          const isFrontend = ['React', 'Vue', 'Vite', 'Create React App', 'Next.js', 'Angular', 'SvelteKit', 'Astro', 'Vanilla JS']
            .includes(framework) && (
              hasDep(allDeps, 'react') ||
              hasDep(allDeps, 'react-dom') ||
              hasDep(allDeps, 'vue') ||
              hasDep(allDeps, 'vite') ||
              hasDep(allDeps, 'next') ||
              hasDep(allDeps, '@angular/core') ||
              hasDep(allDeps, '@sveltejs/kit') ||
              hasDep(allDeps, 'astro') ||
              fs.existsSync(path.join(dir, 'index.html'))
            );
          const backendFramework = detectBackendFramework(allDeps, pkg.scripts || {});
          projects.push({
            project_name: pkg.name || 'unknown-project',
            root_path: dir,
            framework: isFrontend ? framework : backendFramework,
            type: isFrontend ? 'frontend' : 'backend',
            has_playwright: !!allDeps['@playwright/test'],
            run_config: isFrontend
              ? detectFrontendRunConfig(dir, pkg, allDeps, framework)
              : detectBackendRunConfig(dir, pkg, allDeps, backendFramework),
          });
        }
      } catch {
        // skip malformed package.json
      }
    }

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), depth + 1);
    }
  }

  walk(rootPath);
  return { total_projects: projects.length, projects };
}

function run(workspaceRoot) {
  const sourceFiles = scanProjectFiles(workspaceRoot);
  const infrastructure = extractProjectMetadata(workspaceRoot);
  return { status: 'success', source_files: sourceFiles, infrastructure };
}

module.exports = { run };
