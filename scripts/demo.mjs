import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { projectRoot } from './doctor.mjs';
const child = spawnSync(process.execPath, [resolve(projectRoot,'node_modules/playwright/cli.js'), 'test', 'tests/demo.spec.ts'], {cwd:projectRoot,env:{...process.env,BUGCAM_DEMO:'1'},stdio:'inherit'});
if(child.error) console.error('演示无法启动，请先运行 npm run setup 安装依赖。');
process.exitCode = child.status ?? 1;
