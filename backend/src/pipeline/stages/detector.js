const fs = require('fs');
const path = require('path');

const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue']);
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'public', '__pycache__', '.emergent', 'venv']);

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
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        let framework = 'Vanilla JS';
        if (allDeps.react || allDeps['react-dom']) framework = 'React';
        else if (allDeps.vue) framework = 'Vue';
        projects.push({
          project_name: pkg.name || 'unknown-project',
          root_path: dir,
          framework,
          has_playwright: !!allDeps['@playwright/test'],
        });
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
