const { spawn } = require('child_process');
const path = require('path');

const apiDir = path.resolve(__dirname, '..');
const aiDir = path.resolve(apiDir, '..', 'ai_engine');

const children = [];
let shuttingDown = false;

function startProcess(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
  });

  children.push(child);

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.log(`[${name}] stopped with ${signal || `code ${code}`}`);
      shutdown(code || 1);
    }
  });

  child.on('error', (err) => {
    console.error(`[${name}] failed to start: ${err.message}`);
    shutdown(1);
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(exitCode), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

startProcess('ai', 'python3', ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '8001'], aiDir);
startProcess('api', 'node', ['server.js'], apiDir);
