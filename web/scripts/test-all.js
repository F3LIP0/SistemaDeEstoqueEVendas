#!/usr/bin/env node

const { spawn } = require('child_process');

const API_HEALTH_URL = 'http://localhost:3000/api/health';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou (${command} ${args.join(' ')}), exit code: ${code}`));
      }
    });
  });
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isBackendUp() {
  try {
    const response = await fetch(API_HEALTH_URL, { method: 'GET' });
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function waitForBackend(timeoutMs = 20000, intervalMs = 500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isBackendUp()) return true;
    await sleep(intervalMs);
  }
  return false;
}

async function main() {
  let backendProcess = null;
  let backendStartedByScript = false;

  try {
    const alreadyUp = await isBackendUp();
    if (!alreadyUp) {
      console.log('Backend nao detectado em :3000, iniciando automaticamente...');
      backendProcess = spawn('node', ['backend.js'], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
      backendStartedByScript = true;

      const ready = await waitForBackend();
      if (!ready) {
        throw new Error('Backend nao ficou pronto a tempo para executar os testes.');
      }
    } else {
      console.log('Backend ja estava ativo em :3000.');
    }

    await run('npm', ['run', 'test']);
    await run('npm', ['run', 'test:fluxo']);
    await run('npm', ['run', 'test:sistema']);

    console.log('\nSuite completa executada com sucesso.');
  } finally {
    if (backendStartedByScript && backendProcess && !backendProcess.killed) {
      backendProcess.kill('SIGTERM');
    }
  }
}

main().catch((error) => {
  console.error('\nFalha no test:all automatizado:', error.message);
  process.exit(1);
});
