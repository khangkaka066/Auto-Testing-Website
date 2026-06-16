const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const net = require('net');
const { spawn, spawnSync } = require('child_process');
const { SERVICE_INSTALL_TIMEOUT_MS, SERVICE_START_TIMEOUT_MS } = require('../../config/env');

const INSTALL_MARKER = '.testpilot_install_complete';

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

function readLogTail(logFile, maxChars = 6000) {
  try {
    if (!fs.existsSync(logFile)) return '';
    const content = fs.readFileSync(logFile, 'utf-8');
    return content.slice(Math.max(0, content.length - maxChars)).trim();
  } catch {
    return '';
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function commandExists(command, env) {
  const result = spawnSync('sh', ['-lc', `command -v ${shellQuote(command)}`], {
    env,
    stdio: 'ignore',
  });
  return result.status === 0;
}

function serviceEnv(baseEnv, projectRoot) {
 const nodeBinDir = path.dirname(process.execPath);
 const localBinDir = path.join(path.resolve(projectRoot), 'node_modules', '.bin');
  return {
    ...baseEnv,
    PATH: [localBinDir, nodeBinDir, baseEnv.PATH || process.env.PATH].filter(Boolean).join(path.delimiter),
 };
}

function installEnv(baseEnv) {
 return {
 ...baseEnv,
 NODE_ENV: 'development',
 NPM_CONFIG_PRODUCTION: 'false',
 npm_config_production: 'false',
 NPM_CONFIG_INCLUDE: 'dev',
 npm_config_include: 'dev',
 YARN_PRODUCTION: 'false',
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

function withYarnInstallNetworkOptions(args) {
  const parts = String(args || '').trim().split(/\s+/).filter(Boolean);
  if (parts[0] !== 'install') return args || '';

  const hasRegistry = parts.some(part => part === '--registry' || part.startsWith('--registry='));
  const hasNetworkTimeout = parts.some(part => part === '--network-timeout' || part.startsWith('--network-timeout='));
  const hasNonInteractive = parts.includes('--non-interactive');
 const hasIgnoreOptional = parts.includes('--ignore-optional');
 const hasProduction = parts.some(part => part === '--production' || part.startsWith('--production='));

  if (!hasRegistry) parts.push('--registry', 'https://registry.npmjs.org');
  if (!hasNetworkTimeout) parts.push('--network-timeout', '600000');
 if (!hasNonInteractive) parts.push('--non-interactive');
 if (!hasIgnoreOptional) parts.push('--ignore-optional');
 if (!hasProduction) parts.push('--production=false');

 return parts.join(' ');
}

function withNpmInstallDevOptions(args) {
 const parts = String(args || '').trim().split(/\s+/).filter(Boolean);
 if (!['install', 'i', 'ci'].includes(parts[0])) return args || '';

 const hasIncludeDev = parts.some(part => part === '--include=dev' || part === '--also=dev');
 const hasOmitDev = parts.some(part => part === '--omit=dev');
 const hasProduction = parts.some(part => part === '--production' || part.startsWith('--production='));

 if (!hasIncludeDev && !hasOmitDev) parts.push('--include=dev');
 if (!hasProduction) parts.push('--production=false');

 return parts.join(' ');
}

function withPnpmInstallDevOptions(args) {
 const parts = String(args || '').trim().split(/\s+/).filter(Boolean);
 if (parts[0] !== 'install') return args || '';

 const hasProdFlag = parts.some(part => part === '--prod' || part === '-P' || part.startsWith('--prod='));
 if (!hasProdFlag) parts.push('--prod=false');

 return parts.join(' ');
}

function resolvePackageManagerCommand(command, env) {
 if (!command) return command;
 const trimmed = command.trim();

 const npmMatch = trimmed.match(/^npm(?:\s+(.*))?$/);
 if (npmMatch) {
 const args = withNpmInstallDevOptions(npmMatch[1] || '');
 return `npm${args ? ` ${args}` : ''}`;
 }

 const yarnMatch = trimmed.match(/^yarn(?:\s+(.*))?$/);
 if (yarnMatch) {
    const args = withYarnInstallNetworkOptions(yarnMatch[1] || '');
    if (commandExists('yarn', env)) {
      return `yarn${args ? ` ${args}` : ''}`;
    }
    if (commandExists('corepack', env)) {
      return `corepack yarn${args ? ` ${args}` : ''}`;
    }
    return `npx --yes yarn${args ? ` ${args}` : ''}`;
  }

 const pnpmMatch = trimmed.match(/^pnpm(?:\s+(.*))?$/);
 if (pnpmMatch) {
 const args = withPnpmInstallDevOptions(pnpmMatch[1] || '');
 if (commandExists('pnpm', env)) {
 return `pnpm${args ? ` ${args}` : ''}`;
 }
 if (commandExists('corepack', env)) {
 return `corepack pnpm${args ? ` ${args}` : ''}`;
 }
    return `npx --yes pnpm${args ? ` ${args}` : ''}`;
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
      const tail = readLogTail(options.logFile);
      reject(new Error([
        `Command timed out: ${command}`,
        `Log file: ${options.logFile}`,
        tail ? `Log tail:\n${tail}` : null,
      ].filter(Boolean).join('\n')));
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
      else {
        const tail = readLogTail(options.logFile);
        const message = [
          `Command failed (${code}): ${command}`,
          `Log file: ${options.logFile}`,
          tail ? `Log tail:\n${tail}` : null,
        ].filter(Boolean).join('\n');
        reject(new Error(message));
      }
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
    !fs.existsSync(path.join(projectRoot, INSTALL_MARKER));
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
  const startCommandText = resolvePackageManagerCommand(
    resolveStartCommand(service.start_command, service.root_path),
    runtimeEnv
  );
  appendLog(logFile, `[service] ${service.name}\n[command] ${service.start_command}\n[resolved_command] ${startCommandText}\n[cwd] ${service.root_path}\n[url] ${service.url}\n\n`);

 if (service.install_command && shouldInstall(service.root_path)) {
 const dependencyInstallEnv = installEnv(runtimeEnv);
 const installCommandText = resolvePackageManagerCommand(service.install_command, dependencyInstallEnv);
 appendLog(logFile, `[install] ${service.install_command}\n[resolved_install] ${installCommandText}\n`);
 await runCommand(installCommandText, {
 cwd: service.root_path,
 env: dependencyInstallEnv,
 logFile,
 timeoutMs: SERVICE_INSTALL_TIMEOUT_MS,
 });
    fs.writeFileSync(path.join(service.root_path, INSTALL_MARKER), new Date().toISOString(), 'utf-8');
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
      const env = { ...DUMMY_THIRD_PARTY_ENV, ...process.env, ...extraBackendEnv, PORT: String(port), API_PORT: String(port), BACKEND_PORT: String(port) };
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
        // Backend EC2 có thể NODE_ENV=production,
        // nhưng frontend dev server như craco/react-scripts/vite start phải chạy development.
        NODE_ENV: 'development',

        // Đảm bảo yarn/npm không bỏ devDependencies như craco, react-scripts, vite...
        YARN_PRODUCTION: 'false',
        NPM_CONFIG_PRODUCTION: 'false',
        PORT: String(port),
        VITE_PORT: String(port),
        BASE_URL: service.url,
        // Prevent CRA / react-scripts / craco from auto-opening a browser tab.
        // Playwright manages its own browser; an extra tab would open on the host display.
        BROWSER: 'none',
        // CI=true also suppresses the browser prompt on some CRA versions, but we set
        // BROWSER=none explicitly so it works even without CI mode quirks.
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

// Dummy values for third-party services that throw on missing env vars at module load time.
// Real values in process.env or extraBackendEnv always take precedence.
const DUMMY_THIRD_PARTY_ENV = {
  // PayOS
  PAYOS_CLIENT_ID:      'dummy-payos-client-id',
  PAYOS_API_KEY:        'dummy-payos-api-key',
  PAYOS_CHECKSUM_KEY:   'dummy-payos-checksum-key',
  // Stripe
  STRIPE_SECRET_KEY:        'sk_test_dummy',
  STRIPE_PUBLISHABLE_KEY:   'pk_test_dummy',
  STRIPE_WEBHOOK_SECRET:    'whsec_dummy',
  // VNPay
  VNPAY_TMN_CODE:           'DUMMY',
  VNPAY_SECURE_HASH_SECRET: 'dummy-vnpay-secret',
  VNPAY_URL:                'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  VNPAY_RETURN_URL:         'http://localhost/vnpay-return',
  // Momo
  MOMO_PARTNER_CODE:  'DUMMY',
  MOMO_ACCESS_KEY:    'dummy-momo-access-key',
  MOMO_SECRET_KEY:    'dummy-momo-secret-key',
  // ZaloPay
  ZALOPAY_APP_ID: '0',
  ZALOPAY_KEY1:   'dummy-zalopay-key1',
  ZALOPAY_KEY2:   'dummy-zalopay-key2',
  // Generic / catch-all
  JWT_SECRET:         'dummy-jwt-secret-for-testing',
  SESSION_SECRET:     'dummy-session-secret',
  SENDGRID_API_KEY:   'SG.dummy',
  MAILGUN_API_KEY:    'dummy-mailgun-key',
  FIREBASE_API_KEY:   'dummy-firebase-key',
  GOOGLE_CLIENT_ID:   'dummy-google-client-id',
  GOOGLE_CLIENT_SECRET: 'dummy-google-client-secret',
  CLOUDINARY_URL:     'cloudinary://dummy:dummy@dummy',
};

function withoutChild(service) {
  const { child, ...rest } = service;
  return rest;
}

module.exports = {
  startRuntimeServices,
};
