import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const candidates = ['docker'];
if (process.platform === 'win32') {
  if (process.env.LOCALAPPDATA) candidates.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'DockerDesktop', 'resources', 'bin', 'docker.exe'));
  candidates.push(path.join(process.env.ProgramFiles || 'C:/Program Files', 'Docker', 'Docker', 'resources', 'bin', 'docker.exe'));
}
const dockerPath = candidates.find(candidate => spawnSync(candidate, ['--version'], {encoding:'utf8', timeout:5000}).status === 0);
const engine = dockerPath ? spawnSync(dockerPath, ['info', '--format', '{{.ServerVersion}}'], {encoding:'utf8', timeout:10000}) : null;
const file=process.env.TIDECLOAK_CONFIG_PATH||'./config/tidecloak.json';
console.log('Node:',process.version);
console.log('SQLite runtime:',Number(process.versions.node.split('.')[0])>=24?'available':'Node 24 required');
console.log('Docker CLI:',dockerPath?'available':'not found — required only to self-host TideCloak');
console.log('Docker engine:',engine?.status === 0 ? `ready (${engine.stdout.trim()})` : 'not ready — open Docker Desktop and complete first-run setup');
console.log('TideCloak adapter:',fs.existsSync(file)?'present (live verification still required)':'missing — see docs/TIDECLOAK_SETUP.md');
console.log('Authentication mode:',process.env.AUTH_MODE||'tidecloak (default)');
