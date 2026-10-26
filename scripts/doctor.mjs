import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import net from 'node:net';
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function supportedNode(version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 12);
}
export async function diagnose(root = projectRoot, checkPorts = true) {
  const checks = [];
  const add = (ok, message) => checks.push({ ok, message });
  add(supportedNode(), `Node.js ${process.versions.node}：需要 22.12.0 或更高版本，建议使用受支持的 LTS 版本。`);
  if (!existsSync(resolve(root, 'package.json')) || !existsSync(resolve(root, 'package-lock.json'))) {
    add(false, '未找到项目清单或锁文件，请在完整的 BugCam 仓库中运行。');
    return checks;
  }
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
  const missing = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).filter(name => {
    const p = resolve(root, 'node_modules', name, 'package.json');
    return !existsSync(p) || JSON.parse(readFileSync(p, 'utf8')).version !== lock.packages?.[`node_modules/${name}`]?.version;
  });
  add(!missing.length, missing.length ? `依赖缺失或与锁文件不一致：${missing.join('、')}。请运行 npm run setup。` : '项目依赖已安装，直接依赖版本与锁文件一致。');
  if (!missing.length) {
    try {
      process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve(root, '.browsers');
      const { chromium } = await import(pathToFileURL(resolve(root, 'node_modules/playwright/index.mjs')).href);
      const metadata = JSON.parse(readFileSync(resolve(root,'node_modules/playwright-core/browsers.json'),'utf8'));
      const shell = metadata.browsers.find(b => b.name === 'chromium-headless-shell');
      const ffmpeg = metadata.browsers.find(b => b.name === 'ffmpeg');
      const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
      add(existsSync(resolve(base, `chromium_headless_shell-${shell.revision}`)), 'Chromium 无头浏览器：缺失时请运行 npm run setup 安装项目内浏览器。');
      const ffmpegDir = resolve(base, `ffmpeg-${ffmpeg.revision}`);
      add(existsSync(ffmpegDir) && readdirSync(ffmpegDir).some(n => /^ffmpeg-/.test(n)), 'FFmpeg 录像组件：缺失时请运行 npm run setup。');
      try { const browser = await chromium.launch({headless:true,timeout:8000}); await browser.close(); add(true, 'Chromium 已实际启动并关闭。'); } catch { add(false, 'Chromium 无法启动。请运行 npm run setup；Linux 缺少系统库时需自行准备 Playwright 支持的环境，本工具不会安装系统包。'); }
    } catch { add(false, '无法读取 Playwright 浏览器信息，请运行 npm run setup 修复依赖。'); }
  } else add(false, '依赖不完整，暂无法检查浏览器。无需配置模型 API Key。');
  if (checkPorts) for (const port of [4204, 5204]) {
    const free = await new Promise(resolvePort => {
      const server = net.createServer();
      server.once('error', () => resolvePort(false));
      server.listen(port, '127.0.0.1', () => server.close(() => resolvePort(true)));
    });
    add(free, `端口 ${port}：${free ? '可用' : '已占用。若 BugCam 已运行，这是预期现象；测试前请在原终端按 Ctrl+C 停止。勿强制终止未知程序。'}`);
  }
  return checks;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const checks = await diagnose();
    for (const c of checks) console.log(`${c.ok ? '通过' : '需处理'}｜${c.message}`);
    console.log('访问入口：http://127.0.0.1:4204 ｜本地故障示例、启发式探索、无需 API Key。');
    process.exitCode = checks.every(c => c.ok) ? 0 : 1;
  } catch { console.error('诊断失败：项目清单可能损坏。请恢复 package.json 和 package-lock.json 后重试。'); process.exitCode = 1; }
}
