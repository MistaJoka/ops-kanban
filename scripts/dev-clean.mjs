#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command) {
  execSync(command, { cwd: projectRoot, stdio: 'inherit' });
}

function killPort(port) {
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (!pids) {
      return;
    }

    for (const pid of pids.split('\n').filter(Boolean)) {
      try {
        process.kill(Number(pid), 'SIGKILL');
      } catch {
        // Process may already be gone.
      }
    }
  } catch {
    // Nothing listening on the port.
  }
}

console.log('Stopping existing dev servers on port 3000…');
killPort(3000);

try {
  run('pkill -9 -f "next dev"');
} catch {
  // No matching processes.
}

console.log('Removing .next cache…');
rmSync(path.join(projectRoot, '.next'), { recursive: true, force: true });
rmSync(path.join(projectRoot, 'node_modules', '.cache'), { recursive: true, force: true });

console.log('Starting Next.js dev server…');
const result = spawnSync('npx', ['next', 'dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
