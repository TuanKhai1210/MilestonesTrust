import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1'],{stdio:'inherit',env:{...process.env,AUTH_MODE:'demo',DATABASE_PATH:'./data/demo.sqlite'}});
child.on('exit',code=>process.exit(code??1));
process.on('SIGINT',()=>child.kill('SIGINT'));
