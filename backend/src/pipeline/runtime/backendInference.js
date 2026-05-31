const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { stableHash, readCache, writeCache } = require('../../lib/cache');

const ENTRY_CANDIDATES = [
  'server.js', 'app.js', 'index.js', 'main.js',
  'src/server.js', 'src/app.js', 'src/index.js', 'src/main.js',
];

const MAX_ENTRY_LINES = 150;

const BackendRunConfigSchema = z.object({
  start_command: z.string().nullable(),
  port: z.number().int(),
  install_command: z.string(),
  health_path: z.string().nullable(),
});

function readEntryFile(rootPath) {
  for (const candidate of ENTRY_CANDIDATES) {
    const fullPath = path.join(rootPath, candidate);
    if (fs.existsSync(fullPath)) {
      const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').slice(0, MAX_ENTRY_LINES);
      return { file: candidate, content: lines.join('\n') };
    }
  }
  return null;
}

function needsInference(project) {
  return (
    project.type === 'backend' &&
    project.run_config &&
    (!project.run_config.start_command || project.run_config.confidence === 'low')
  );
}

async function inferBackendRunConfig(project, cacheDir) {
  const rootPath = project.root_path;
  const pkgPath = path.join(rootPath, 'package.json');

  let pkgContent = '';
  try {
    pkgContent = fs.readFileSync(pkgPath, 'utf-8');
  } catch {
    return null;
  }

  const entry = readEntryFile(rootPath);

  const userContent = [
    `## package.json\n\`\`\`json\n${pkgContent}\n\`\`\``,
    entry ? `## ${entry.file}\n\`\`\`js\n${entry.content}\n\`\`\`` : '',
  ].filter(Boolean).join('\n\n');

  const cacheSubDir = path.join(cacheDir, 'backend_inference');
  const cacheKey = stableHash({ type: 'backend_inference', content: userContent });
  const cached = readCache(cacheSubDir, cacheKey);
  if (cached) {
    console.log(`  [BackendInference] Cache hit for "${project.project_name}"`);
    return cached;
  }

  const { model, systemPrompt } = loadPrompt('BackendInference');
  const result = await parseStructured(model, systemPrompt, userContent, BackendRunConfigSchema, 'backend_run_config');

  if (!result || !result.start_command) return null;

  const inferred = {
    package_manager: project.run_config.package_manager || 'npm',
    install_command: result.install_command || project.run_config.install_command || 'npm install',
    start_command: result.start_command,
    url: `http://localhost:${result.port}`,
    port: result.port,
    health_path: result.health_path || null,
    confidence: 'ai-inferred',
  };

  writeCache(cacheSubDir, cacheKey, inferred);
  return inferred;
}

async function enrichInfrastructureWithAI(infrastructure, cacheDir) {
  if (!infrastructure || !Array.isArray(infrastructure.projects)) return infrastructure;

  const candidates = infrastructure.projects.filter(needsInference);
  if (candidates.length === 0) return infrastructure;

  const enriched = { ...infrastructure, projects: [...infrastructure.projects] };

  for (let i = 0; i < enriched.projects.length; i++) {
    const project = enriched.projects[i];
    if (!needsInference(project)) continue;

    console.log(`  [BackendInference] Inferring run config for "${project.project_name}"...`);
    try {
      const inferred = await inferBackendRunConfig(project, cacheDir);
      if (inferred) {
        enriched.projects[i] = { ...project, run_config: inferred };
        console.log(`  [BackendInference] → start_command: "${inferred.start_command}", port: ${inferred.port}`);
      } else {
        console.warn(`  [BackendInference] Could not infer run config for "${project.project_name}"`);
      }
    } catch (err) {
      console.warn(`  [BackendInference] Failed for "${project.project_name}": ${err.message}`);
    }
  }

  return enriched;
}

module.exports = { enrichInfrastructureWithAI };
