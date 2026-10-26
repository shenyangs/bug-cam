import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { projectRoot, supportedNode, supportedNodeRange } from './doctor.mjs';
if (!supportedNode()) { console.error(`安装已停止：Node.js 支持范围 ${supportedNodeRange}（不支持 Node 23、25）。请自行安装受支持版本后重试；本脚本不会修改系统设置。`); process.exit(1); }
const npmCli = process.env.npm_execpath;
if (!npmCli) { console.error('请使用 npm run setup 启动安装。'); process.exit(1); }
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: resolve(projectRoot, '.browsers'), npm_config_cache: resolve(projectRoot, '.npm-cache') };
for (const [message, args] of [
  ['正在按锁文件安装项目依赖…', [npmCli, 'ci', '--cache', '.npm-cache']],
  ['正在检查并安装 Chromium 无头浏览器与录像组件，已有匹配版本将复用…', [resolve(projectRoot, 'node_modules/playwright/cli.js'), 'install', 'chromium', '--only-shell']]
]) {
  console.log(`[BugCam] ${message}`);
  const result = spawnSync(process.execPath, args, { cwd: projectRoot, env, stdio: 'inherit' });
  if (result.error || result.status !== 0) { console.error('安装未完成。请检查网络与日志后重新运行 npm run setup；不会安装系统软件。'); process.exit(result.status || 1); }
}
console.log('安装完成！运行 npm run doctor 检查，再运行 npm run dev。访问 http://127.0.0.1:4204 。无需 API Key。');
