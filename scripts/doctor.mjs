import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const docker=spawnSync('docker',['--version'],{encoding:'utf8'});
const file=process.env.TIDECLOAK_CONFIG_PATH||'./config/tidecloak.json';
console.log('Node:',process.version);
console.log('SQLite runtime:',Number(process.versions.node.split('.')[0])>=24?'available':'Node 24 required');
console.log('Docker CLI:',docker.status===0?'available':'not found — required only to self-host TideCloak');
console.log('TideCloak adapter:',fs.existsSync(file)?'present (live verification still required)':'missing — see docs/TIDECLOAK_SETUP.md');
console.log('Authentication mode:',process.env.AUTH_MODE||'tidecloak (default)');
