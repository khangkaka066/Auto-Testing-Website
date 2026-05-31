const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const net = require('net');
const { spawn } = require('child_process');
const { SERVICE_START_TIMEOUT_MS } = require('../../config/env');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isPortFree(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function choosePort(preferredPort, usedPorts) {
  let port = Number(preferredPort) || 3001;
  while (port < 65536 && (usedPorts.has(port) || !(await isPortFree(port)))) {
    port += 1;
  }
  if (port >= 65536) {
    throw new Error(`No available port found starting from ${preferredPort || 3001}`);
  }
  usedPorts.add(port);
  return port;
}

function withPort(url, port) {
  try {
    const parsed = new URL(url || `http://localhost:${port}`);
    parsed.hostname = parsed.hostname || 'localhost';
    parsed.port = String(port);
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return `http://localhost:${port}`;
  }
}

function requestUrl(url) {
  return new Promise(resolve => {
    const transport = url.startsWith('https:') ? https : http;
    const req = transport.get(url, { timeout: 3000 }, res => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

function isPortListening(port) {
  return new Promise(resolve => {
    const socket = net.connect({ port, host: '127.0.0.1' }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.setTimeout(2000);
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => resolve(false));
  });
}

async function waitForReady(service, timeoutMs) {
  const httpUrls = service.health_path
    ? [`${service.url}${service.health_path}`, service.url]
    : [service.url];

  // Phase 1: wait for TCP port to open (fast, works on any backend)
  const tcpDeadline = Date.now() + timeoutMs;
  while (Date.now() < tcpDeadline) {
    if (await isPortListening(service.port)) break;
    await sleep(1000);
  }
  if (!await isPortListening(service.port)) {
    throw new Error(`Service ${service.name} did not open port ${service.port} within timeout`);
  }

  // Phase 2: try HTTP health check (best-effort, 10 s grace)
  const httpDeadline = Date.now() + 10000;
  while (Date.now() < httpDeadline) {
    for (const url of httpUrls) {
      if (await requestUrl(url)) return url;
    }
    await sleep(500);
  }

  // Port is open but no HTTP endpoint responded — treat as ready (backend has no /health)
  return service.url;
}

function appendLog(logFile, message) {
  fs.appendFileSync(logFile, message, 'utf-8');
}

function serviceEnv(baseEnv, projectRoot) {
  const nodeBinDir = path.dirname(process.execPath);
  const localBinDir = path.join(path.resolve(projectRoot), 'node_modules', '.bin');
  return {
    ...baseEnv,
    PATH: [localBinDir, nodeBinDir, baseEnv.PATH || process.env.PATH].filter(Boolean).join(path.delimiter),
  };
}

function readPackageScript(projectRoot, scriptName) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
    return pkg.scripts && pkg.scripts[scriptName] ? pkg.scripts[scriptName] : null;
  } catch {
    return null;
  }
}

function resolveStartCommand(command, projectRoot) {
  if (!command) return command;
  if (command === 'npm start') return readPackageScript(projectRoot, 'start') || command;

  const npmRunMatch = command.match(/^npm run ([^\s]+)$/);
  if (npmRunMatch) {
    return readPackageScript(projectRoot, npmRunMatch[1]) || command;
  }

  return command;
}

function runCommand(command, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: options.cwd,
      env: options.env,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out: ${command}`));
    }, options.timeoutMs || 120000);

    child.stdout.on('data', chunk => appendLog(options.logFile, chunk.toString()));
    child.stderr.on('data', chunk => appendLog(options.logFile, chunk.toString()));
    child.on('error', err => {
      clearTimeout(timeout);
      reject(err);
    });
    child.on('close', code => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${command}`));
    });
  });
}

function startCommand(command, options) {
  const child = spawn(command, {
    cwd: options.cwd,
    env: options.env,
    shell: true,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', chunk => appendLog(options.logFile, chunk.toString()));
  child.stderr.on('data', chunk => appendLog(options.logFile, chunk.toString()));
  child.on('error', err => appendLog(options.logFile, `\n[service error] ${err.message}\n`));
  return child;
}

function stopProcess(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // best effort shutdown
    }
  }
}

function shouldInstall(projectRoot) {
  return fs.existsSync(path.join(projectRoot, 'package.json')) &&
    !fs.existsSync(path.join(projectRoot, 'node_modules'));
}

function buildService(project, kind, port) {
  const runConfig = project.run_config || {};
  return {
    kind,
    name: project.project_name || kind,
    framework: project.framework || 'Unknown',
    root_path: project.root_path,
    install_command: runConfig.install_command || null,
    start_command: runConfig.start_command || null,
    port,
    url: withPort(runConfig.url, port),
    health_path: kind === 'backend' ? (runConfig.health_path || '/health') : null,
    confidence: runConfig.confidence || 'low',
  };
}

function pickServices(infrastructure) {
  const projects = infrastructure && Array.isArray(infrastructure.projects)
    ? infrastructure.projects
    : [];

  const backends = projects.filter(project =>
    project.type === 'backend' &&
    project.run_config &&
    project.run_config.start_command
  );
  const frontends = projects.filter(project =>
    project.type === 'frontend' &&
    project.run_config &&
    project.run_config.start_command &&
    project.run_config.url
  );

  return {
    backend: backends[0] || null,
    frontend: frontends[0] || null,
  };
}

async function startService(service, logsDir, env) {
  const logFile = path.join(logsDir, `${service.kind}.log`);
  const runtimeEnv = serviceEnv(env, service.root_path);
  const startCommandText = resolveStartCommand(service.start_command, service.root_path);
  appendLog(logFile, `[service] ${service.name}\n[command] ${service.start_command}\n[resolved_command] ${startCommandText}\n[cwd] ${service.root_path}\n[url] ${service.url}\n\n`);

  if (service.install_command && shouldInstall(service.root_path)) {
    appendLog(logFile, `[install] ${service.install_command}\n`);
    await runCommand(service.install_command, {
      cwd: service.root_path,
      env: runtimeEnv,
      logFile,
      timeoutMs: 180000,
    });
    appendLog(logFile, '\n[install complete]\n');
  }

  const child = startCommand(startCommandText, {
    cwd: service.root_path,
    env: runtimeEnv,
    logFile,
  });

  const exitBeforeReady = new Promise((_, reject) => {
    child.once('close', code => {
      reject(new Error(`Service ${service.name} exited before becoming ready (code ${code})`));
    });
  });
  const readyUrl = await Promise.race([
    waitForReady(service, SERVICE_START_TIMEOUT_MS),
    exitBeforeReady,
  ]);
  appendLog(logFile, `\n[ready] ${readyUrl}\n`);
  return { ...service, ready_url: readyUrl, pid: child.pid, status: 'ready', child };
}

async function startRuntimeServices(infrastructure, outputDir, extraBackendEnv = {}) {
  fs.mkdirSync(outputDir, { recursive: true });
  const logsDir = path.join(outputDir, 'service_logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const selected = pickServices(infrastructure);
  const usedPorts = new Set();
  const running = [];
  const manifest = {
    generated_at: new Date().toISOString(),
    backend: null,
    frontend: null,
  };

  // ── Start backend (non-fatal: DB-dependent backends may fail) ──
  if (selected.backend) {
    try {
      const port = await choosePort(selected.backend.run_config.port, usedPorts);
      const service = buildService(selected.backend, 'backend', port);
      const env = { ...process.env, ...extraBackendEnv, PORT: String(port), API_PORT: String(port), BACKEND_PORT: String(port) };
      const started = await startService(service, logsDir, env);
      running.push(started);
      manifest.backend = withoutChild(started);
    } catch (err) {
      const dbTypes = selected.backend.database_types || [];
      const hint = dbTypes.length > 0
        ? ` (requires database: ${dbTypes.join(', ')})`
        : '';
      console.warn(`[serviceManager] Backend failed to start${hint}: ${err.message}`);
      console.warn('[serviceManager] Continuing with frontend-only mode.');
      appendLog(
        path.join(logsDir, 'backend.log'),
        `\n[startup failed] ${err.message}\n`
      );
      manifest.backend = {
        status: 'failed',
        error: err.message,
        requires_database: selected.backend.requires_database || false,
        database_types: dbTypes,
      };
    }
  }

  // ── Start frontend (always attempted) ──────────────────────────
  try {
    if (selected.frontend) {
      const port = await choosePort(selected.frontend.run_config.port, usedPorts);
      const service = buildService(selected.frontend, 'frontend', port);
      const env = {
        ...process.env,
        PORT: String(port),
        VITE_PORT: String(port),
        BASE_URL: service.url,
      };
      if (manifest.backend && manifest.backend.status !== 'failed') {
        env.API_BASE_URL = manifest.backend.url;
        env.BACKEND_URL = manifest.backend.url;
        env.VITE_API_BASE_URL = manifest.backend.url;
        env.REACT_APP_API_BASE_URL = manifest.backend.url;
      }
      const started = await startService(service, logsDir, env);
      running.push(started);
      manifest.frontend = withoutChild(started);
    }

    fs.writeFileSync(path.join(outputDir, 'runtime_services.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    return {
      manifest,
      env: buildExecutorEnv(manifest),
      stop: async () => {
        for (const service of [...running].reverse()) stopProcess(service.child);
      },
    };
  } catch (err) {
    for (const service of [...running].reverse()) stopProcess(service.child);
    manifest.error = err.message;
    fs.writeFileSync(path.join(outputDir, 'runtime_services.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    throw err;
  }
}

function buildExecutorEnv(manifest) {
  const env = {
    PLAYWRIGHT_MANAGED_SERVICES: 'true',
  };
  if (manifest.frontend && manifest.frontend.url) {
    env.BASE_URL = manifest.frontend.url;
    env.FRONTEND_URL = manifest.frontend.url;
  }
  if (manifest.backend && manifest.backend.url && manifest.backend.status !== 'failed') {
    env.API_BASE_URL = manifest.backend.url;
    env.BACKEND_URL = manifest.backend.url;
  }
  return env;
}

function withoutChild(service) {
  const { child, ...rest } = service;
  return rest;
}

module.exports = {
  startRuntimeServices,
};
