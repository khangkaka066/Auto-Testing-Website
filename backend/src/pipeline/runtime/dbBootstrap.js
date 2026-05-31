'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const { execSync, spawnSync } = require('child_process');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { stableHash, readCache, writeCache } = require('../../lib/cache');

// ── DB configurations ───────────────────────────────────────────────────────

const DB_CONFIGS = {
  mysql: {
    image: 'mysql:8.0',
    containerPort: 3306,
    defaultPort: 3306,
    startArgs: (port, name) => [
      'run', '-d', '--name', name,
      '-p', `${port}:3306`,
      '-e', 'MYSQL_ROOT_PASSWORD=testpass',
      '-e', 'MYSQL_DATABASE=testdb',
      '-e', 'MYSQL_ROOT_HOST=%',
      '--rm',
      'mysql:8.0',
    ],
    readyArgs: (name) => ['exec', name, 'mysql', '-h', '127.0.0.1', '-uroot', '-ptestpass', '-e', 'SELECT 1', 'testdb'],
    buildEnv: (port) => ({
      DB_HOST: '127.0.0.1', DB_PORT: String(port),
      DB_NAME: 'testdb', DB_DATABASE: 'testdb',
      DB_USER: 'root', DB_PASSWORD: 'testpass',
      MYSQL_HOST: '127.0.0.1', MYSQL_PORT: String(port),
      MYSQL_DATABASE: 'testdb', MYSQL_USER: 'root', MYSQL_PASSWORD: 'testpass',
      DATABASE_URL: `mysql://root:testpass@127.0.0.1:${port}/testdb`,
    }),
  },
  postgres: {
    image: 'postgres:15-alpine',
    containerPort: 5432,
    defaultPort: 5432,
    startArgs: (port, name) => [
      'run', '-d', '--name', name,
      '-p', `${port}:5432`,
      '-e', 'POSTGRES_PASSWORD=testpass',
      '-e', 'POSTGRES_DB=testdb',
      '-e', 'POSTGRES_USER=postgres',
      '--rm',
      'postgres:15-alpine',
    ],
    readyArgs: (name) => ['exec', name, 'pg_isready', '-U', 'postgres'],
    buildEnv: (port) => ({
      DB_HOST: '127.0.0.1', DB_PORT: String(port),
      DB_NAME: 'testdb', DB_USER: 'postgres', DB_PASSWORD: 'testpass',
      PGHOST: '127.0.0.1', PGPORT: String(port),
      PGDATABASE: 'testdb', PGUSER: 'postgres', PGPASSWORD: 'testpass',
      DATABASE_URL: `postgresql://postgres:testpass@127.0.0.1:${port}/testdb`,
    }),
  },
  mongodb: {
    image: 'mongo:7',
    containerPort: 27017,
    defaultPort: 27017,
    startArgs: (port, name) => [
      'run', '-d', '--name', name,
      '-p', `${port}:27017`,
      '--rm',
      'mongo:7',
    ],
    readyArgs: (name) => ['exec', name, 'mongosh', '--eval', 'db.runCommand({ping:1})', '--quiet'],
    buildEnv: (port) => ({
      MONGO_URI: `mongodb://127.0.0.1:${port}/testdb`,
      MONGODB_URI: `mongodb://127.0.0.1:${port}/testdb`,
      MONGO_URL: `mongodb://127.0.0.1:${port}/testdb`,
      DATABASE_URL: `mongodb://127.0.0.1:${port}/testdb`,
      DB_HOST: '127.0.0.1', DB_PORT: String(port),
    }),
  },
};

// Map detector's database_types values → config key
const DB_TYPE_PRIORITY = ['mysql', 'postgres', 'mongodb'];

const DETECTOR_TYPE_MAP = {
  mysql: 'mysql',
  postgres: 'postgres',
  mongodb: 'mongodb',
  // ORM-only entries: default to postgres (common production choice)
  sequelize: 'mysql',
  orm: 'postgres',
};

// ── Schema inference Zod schema ─────────────────────────────────────────────

const DbSchemaResultSchema = z.object({
  dialect: z.enum(['mysql', 'postgres', 'mongodb']),
  schema_statements: z.array(z.string()),
  seed_statements: z.array(z.string()),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isPortFree(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

async function findFreePort(preferred) {
  let port = Number(preferred) || 3307;
  while (port < 65000) {
    if (await isPortFree(port)) return port;
    port++;
  }
  throw new Error('No free port available');
}

function isDockerAvailable() {
  try {
    execSync('docker info --format "{{.ID}}"', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch (err) {
    const msg = err.stderr ? err.stderr.toString() : String(err);
    if (msg.includes('permission denied') || msg.includes('docker.sock')) {
      console.warn('[DbBootstrap] Docker is installed but current user lacks permission.');
      console.warn('[DbBootstrap] Fix: run "sudo usermod -aG docker $USER" then re-login (or "newgrp docker").');
    }
    return false;
  }
}

function resolveDbType(databaseTypes) {
  if (!Array.isArray(databaseTypes)) return null;
  // Prefer specific DB libs over ORMs
  for (const priority of DB_TYPE_PRIORITY) {
    if (databaseTypes.includes(priority)) return priority;
  }
  // Fallback to ORM mapping
  for (const t of databaseTypes) {
    if (DETECTOR_TYPE_MAP[t] && DB_CONFIGS[DETECTOR_TYPE_MAP[t]]) {
      return DETECTOR_TYPE_MAP[t];
    }
  }
  return null;
}

// ── SQL file discovery (Priority 1) ─────────────────────────────────────────

// Directories to scan for .sql files (checked at both backendRoot and its parent)
const SQL_SCAN_DIRS = [
  'sql_scripts', 'sql', 'scripts', 'db/scripts', 'database/scripts',
  'schema', 'schemas', 'migrations', 'db', 'database',
  'seed', 'seeds', 'scripts/sql', 'config/sql',
];

const SEED_NAME_KEYWORDS   = ['insert', 'seed', 'data', 'fixture', 'mock', 'sample', 'populate'];
const SCHEMA_NAME_KEYWORDS = ['create', 'schema', 'init', 'setup', 'structure', 'ddl', 'table', 'migration'];

function categorizeSqlFile(filename) {
  const base = path.basename(filename, '.sql').toLowerCase();
  if (SEED_NAME_KEYWORDS.some(kw => base.includes(kw))) return 'seed';
  if (SCHEMA_NAME_KEYWORDS.some(kw => base.includes(kw))) return 'schema';
  return 'schema'; // default: treat unknown .sql files as schema
}

function collectSqlFromDir(dir, schemaFiles, seedFiles, seen) {
  if (!fs.existsSync(dir)) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isFile() || path.extname(e.name).toLowerCase() !== '.sql') continue;
    const full = path.join(dir, e.name);
    if (seen.has(full)) continue;
    seen.add(full);
    if (categorizeSqlFile(e.name) === 'seed') seedFiles.push(full);
    else schemaFiles.push(full);
  }
}

function findSqlFiles(backendRoot) {
  const schemaFiles = [];
  const seedFiles   = [];
  const seen        = new Set();

  // Scan at backendRoot AND its parent (handles monorepos: server/ inside project/)
  const roots = [backendRoot, path.dirname(backendRoot)];

  for (const root of roots) {
    collectSqlFromDir(root, schemaFiles, seedFiles, seen);          // root-level .sql files
    for (const dir of SQL_SCAN_DIRS) {
      collectSqlFromDir(path.join(root, dir), schemaFiles, seedFiles, seen);
    }
  }

  return { schemaFiles, seedFiles };
}

function cleanAndSplitSql(sql) {
  // Strip block comments and line comments
  const clean = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--[^\n]*/g, '');

  return clean
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      if (!s) return false;
      const upper = s.toUpperCase();
      // Drop database-level statements — we apply into the pre-created testdb
      if (upper.startsWith('CREATE DATABASE') || upper.startsWith('DROP DATABASE') || upper.startsWith('USE ')) return false;
      return true;
    });
}

// ── Source scanning for AI fallback (Priority 2) ────────────────────────────

const SOURCE_SCAN_DIRS = [
  'src/services', 'src/service', 'services',
  'src/controllers', 'src/controller', 'controllers',
  'src/config', 'src/repositories', 'repositories',
  'src/models', 'models', 'src/entities', 'entities',
  'prisma',
];

const SOURCE_EXTS   = new Set(['.js', '.ts', '.prisma']);
const MAX_SRC_FILES = 10;
const MAX_SRC_LINES = 200;
const MAX_SRC_CHARS = 6000;

function scanSourceFiles(backendRoot) {
  const collected = [];
  const seen = new Set();

  function tryFile(filePath) {
    if (seen.has(filePath) || collected.length >= MAX_SRC_FILES) return;
    if (!fs.existsSync(filePath)) return;
    if (!fs.statSync(filePath).isFile()) return;
    if (!SOURCE_EXTS.has(path.extname(filePath).toLowerCase())) return;
    seen.add(filePath);
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').slice(0, MAX_SRC_LINES).join('\n');
    collected.push({ rel: path.relative(backendRoot, filePath), content: lines });
  }

  function tryDir(dir) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
    try {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
        if (e.isFile()) tryFile(path.join(dir, e.name));
      });
    } catch { /* ignore */ }
  }

  tryFile(path.join(backendRoot, 'prisma/schema.prisma'));
  for (const dir of SOURCE_SCAN_DIRS) tryDir(path.join(backendRoot, dir));

  let result = '';
  for (const { rel, content } of collected) {
    const block = `\n## ${rel}\n\`\`\`\n${content}\n\`\`\`\n`;
    if ((result + block).length > MAX_SRC_CHARS) break;
    result += block;
  }
  return result;
}

// ── Schema resolution: SQL files → AI fallback ──────────────────────────────

async function inferSchema(dialect, backendRoot, cacheDir) {
  // ── Priority 1: Real SQL files from the project ────────────────────
  const { schemaFiles, seedFiles } = findSqlFiles(backendRoot);

  if (schemaFiles.length > 0 || seedFiles.length > 0) {
    const relBase = path.dirname(backendRoot);
    console.log(`  [DbBootstrap] Found real SQL files:`);
    schemaFiles.forEach(f => console.log(`    schema: ${path.relative(relBase, f)}`));
    seedFiles.forEach(f   => console.log(`    seed  : ${path.relative(relBase, f)}`));

    const schemaStatements = schemaFiles
      .flatMap(f => { try { return cleanAndSplitSql(fs.readFileSync(f, 'utf-8')); } catch { return []; } });
    const seedStatements = seedFiles
      .flatMap(f => { try { return cleanAndSplitSql(fs.readFileSync(f, 'utf-8')); } catch { return []; } });

    console.log(`  [DbBootstrap] ${schemaStatements.length} schema + ${seedStatements.length} seed statements parsed`);
    return { dialect, schema_statements: schemaStatements, seed_statements: seedStatements };
  }

  // ── Priority 2: AI infers schema from JS/TS source files ──────────
  const sourceSnippet = scanSourceFiles(backendRoot);
  if (!sourceSnippet.trim()) {
    console.log('  [DbBootstrap] No SQL files or source hints found — skipping schema inference');
    return null;
  }

  const userContent = `Database dialect: ${dialect}\n\nBackend source files:\n${sourceSnippet}`;
  const cacheSubDir = path.join(cacheDir, 'db_schema_inference');
  const cacheKey = stableHash({ type: 'db_schema', dialect, content: userContent });
  const cached = readCache(cacheSubDir, cacheKey);
  if (cached) {
    console.log('  [DbBootstrap] Schema inference cache hit');
    return cached;
  }

  console.log('  [DbBootstrap] Calling AI for schema inference...');
  const { model, systemPrompt } = loadPrompt('DbSchemaInference');
  try {
    const result = await parseStructured(model, systemPrompt, userContent, DbSchemaResultSchema, 'db_schema');
    writeCache(cacheSubDir, cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`  [DbBootstrap] Schema inference AI call failed: ${err.message}`);
    return null;
  }
}

// ── Container management ────────────────────────────────────────────────────

function dockerRun(args) {
  const result = spawnSync('docker', args, { stdio: 'pipe', timeout: 30000 });
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString().trim() : '';
    throw new Error(`docker ${args[0]} failed: ${stderr}`);
  }
  return result.stdout ? result.stdout.toString().trim() : '';
}

async function waitForDbReady(containerName, dbType, timeoutMs = 90000) {
  const cfg = DB_CONFIGS[dbType];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = spawnSync('docker', cfg.readyArgs(containerName), { stdio: 'pipe', timeout: 5000 });
    if (result.status === 0) return;
    await sleep(2000);
  }
  throw new Error(`Database container "${containerName}" not ready within ${timeoutMs / 1000}s`);
}

function applyStatementsToMysql(containerName, statements) {
  const sql = statements.join(';\n') + ';';
  const result = spawnSync(
    'docker',
    ['exec', '-i', containerName, 'mysql', '-h', '127.0.0.1', '-uroot', '-ptestpass', 'testdb'],
    { input: sql, stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000 }
  );
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString().trim() : '';
    throw new Error(`MySQL schema apply failed: ${stderr}`);
  }
}

function applyStatementsToPostgres(containerName, statements) {
  const sql = statements.join(';\n') + ';';
  const result = spawnSync(
    'docker',
    ['exec', '-i', containerName, 'psql', '-U', 'postgres', 'testdb'],
    { input: sql, stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000 }
  );
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString().trim() : '';
    throw new Error(`Postgres schema apply failed: ${stderr}`);
  }
}

function applyStatementsToMongo(containerName, statements) {
  for (const stmt of statements) {
    const result = spawnSync(
      'docker',
      ['exec', containerName, 'mongosh', 'testdb', '--eval', stmt, '--quiet'],
      { stdio: 'pipe', timeout: 15000 }
    );
    if (result.status !== 0) {
      const stderr = result.stderr ? result.stderr.toString().trim() : '';
      console.warn(`  [DbBootstrap] MongoDB statement warning: ${stderr.slice(0, 200)}`);
    }
  }
}

function applyStatements(containerName, dbType, statements) {
  if (!statements || statements.length === 0) return;
  if (dbType === 'mysql') return applyStatementsToMysql(containerName, statements);
  if (dbType === 'postgres') return applyStatementsToPostgres(containerName, statements);
  if (dbType === 'mongodb') return applyStatementsToMongo(containerName, statements);
}

// ── Main bootstrap ──────────────────────────────────────────────────────────

async function bootstrapDatabase(project, cacheDir, logsDir, containerSuffix) {
  const dbType = resolveDbType(project.database_types);
  if (!dbType) {
    console.log(`  [DbBootstrap] No supported DB type for "${project.project_name}" — skipping`);
    return null;
  }

  const cfg = DB_CONFIGS[dbType];
  const port = await findFreePort(cfg.defaultPort); // Prefer default port so projects that hardcode it still connect
  const containerName = `playwright-db-${dbType}-${containerSuffix}`;

  const logFile = path.join(logsDir, `db_${dbType}.log`);
  const log = (msg) => {
    console.log(`  [DbBootstrap] ${msg}`);
    fs.appendFileSync(logFile, msg + '\n', 'utf-8');
  };

  log(`Starting ${dbType} container on port ${port} (image: ${cfg.image})`);

  // Start container
  try {
    dockerRun(cfg.startArgs(port, containerName));
  } catch (err) {
    log(`Failed to start container: ${err.message}`);
    throw err;
  }

  log('Waiting for database to be ready...');
  try {
    await waitForDbReady(containerName, dbType, 120000);
  } catch (err) {
    log(`Database not ready: ${err.message}`);
    // Try to stop the container anyway
    spawnSync('docker', ['stop', containerName], { stdio: 'pipe', timeout: 10000 });
    throw err;
  }

  log('Database is ready');

  // Infer and apply schema
  const schemaResult = await inferSchema(dbType, project.root_path, cacheDir);
  if (schemaResult) {
    const totalStmts = (schemaResult.schema_statements || []).length + (schemaResult.seed_statements || []).length;
    log(`Applying ${schemaResult.schema_statements?.length || 0} schema + ${schemaResult.seed_statements?.length || 0} seed statements`);

    try {
      applyStatements(containerName, dbType, schemaResult.schema_statements || []);
      log('Schema applied');
    } catch (err) {
      log(`Schema apply warning (backend ORM may self-migrate): ${err.message}`);
    }

    try {
      applyStatements(containerName, dbType, schemaResult.seed_statements || []);
      log('Seed data inserted');
    } catch (err) {
      log(`Seed data warning: ${err.message}`);
    }
  } else {
    log('No schema inferred — backend ORM may self-create tables on startup');
  }

  const envVars = cfg.buildEnv(port);
  log(`Injecting env vars: DB_HOST=127.0.0.1 DB_PORT=${port} DATABASE_URL=...`);

  return {
    dbType,
    containerName,
    port,
    envVars,
    stop: () => {
      log('Stopping container...');
      spawnSync('docker', ['stop', containerName], { stdio: 'pipe', timeout: 15000 });
    },
  };
}

// ── Exported entry point ────────────────────────────────────────────────────

async function bootstrapDatabases(infrastructure, cacheDir, logsDir, runId) {
  if (!infrastructure || !Array.isArray(infrastructure.projects)) {
    return { dbEnvsByProject: {}, stop: () => {} };
  }

  const dbProjects = infrastructure.projects.filter(
    p => p.type === 'backend' && p.requires_database && p.database_types && p.database_types.length > 0
  );

  if (dbProjects.length === 0) {
    return { dbEnvsByProject: {}, stop: () => {} };
  }

  if (!isDockerAvailable()) {
    console.warn('[DbBootstrap] Docker is not available — skipping database bootstrap. Backend may fail due to missing DB.');
    return { dbEnvsByProject: {}, stop: () => {} };
  }

  fs.mkdirSync(logsDir, { recursive: true });

  const bootstrapped = [];
  const dbEnvsByProject = {};
  const suffix = runId.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 30);

  for (const project of dbProjects) {
    const projSuffix = `${suffix}-${project.project_name.replace(/[^a-z0-9]/gi, '').slice(0, 10)}`;
    console.log(`[STAGE 2] DbBootstrap: "${project.project_name}" needs ${(project.database_types || []).join(', ')}`);
    try {
      const result = await bootstrapDatabase(project, cacheDir, logsDir, projSuffix);
      if (result) {
        bootstrapped.push(result);
        dbEnvsByProject[project.project_name] = result.envVars;
        console.log(`  [DbBootstrap] ✓ ${result.dbType} ready at port ${result.port}`);
      }
    } catch (err) {
      console.warn(`  [DbBootstrap] ✗ Failed for "${project.project_name}": ${err.message}`);
      console.warn('  [DbBootstrap] Backend will start without DB — graceful degradation applies.');
    }
  }

  return {
    dbEnvsByProject,
    stop: () => {
      for (const b of bootstrapped) {
        try { b.stop(); } catch { /* best effort */ }
      }
    },
  };
}

module.exports = { bootstrapDatabases };
