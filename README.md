# BugCam · 浏览器异常捕手

**让浏览器点出异常，把复现证据留下来。**

BugCam 是一个中文默认的「本地示例有界异常检测」工具：真实 Chromium 依次探索内置示例中的控件，捕获页面异常，再独立重放并保存截图、录像与准确时间。

默认是**预置故障示例（fixture）+ 启发式探索（heuristic），未使用 AI 模型**。不需要账号、模型服务或 API Key。示例故意包含一个缺陷；浏览器操作、异常、截图和录像全部真实产生。AI 冲刺状态为 **PARTIAL**，不宣称具有通用生产网站找 Bug 能力。

## 环境与安装

需要 **Node.js 22.12.0 或更高版本和 npm**，建议使用受支持的 Node LTS 版本。需要能够运行 Playwright Chromium 的操作系统、可用的 4204 / 5204 端口。首次安装需要网络下载 npm 依赖、Chromium 无头浏览器与 FFmpeg 录像组件；不使用模型服务。

进入克隆后的仓库目录，Windows PowerShell、macOS 和 Linux 均可执行：

```sh
npm run setup
npm run doctor
npm run dev
```

`setup` 即使在没有 `node_modules` 时也可启动。它先运行 `npm ci --cache .npm-cache`，然后仅安装所需 Chromium 无头浏览器与录像组件到项目内 `.browsers`；已安装匹配版本会复用。脚本不会安装系统包、修改全局配置或浏览器设置。`doctor` 检查 Node 版本、直接依赖与锁文件、浏览器组件、实际 Chromium 启动、端口，并输出中文恢复指引。没有任何 Key 检查。

浏览器界面：**http://127.0.0.1:4204**

API 健康检查：http://127.0.0.1:5204/api/health

内置示例：http://127.0.0.1:5204/fixture/

这是 localhost 本机访问服务，仅绑定 `127.0.0.1`。请使用上面的准确地址，不使用局域网 IP 或隧道。启动终端也会输出入口。停止服务请在启动终端按 **Ctrl+C**。

### 手动安装与系统差异

macOS / Linux：

```sh
npm ci --cache .npm-cache
PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright install chromium --only-shell
npm run doctor
npm run dev
```

Windows PowerShell：

```powershell
npm ci --cache .npm-cache
$env:PLAYWRIGHT_BROWSERS_PATH = '.browsers'
npx playwright install chromium --only-shell
npm run doctor
npm run dev
```

Windows CMD 设环境变量时使用 `set PLAYWRIGHT_BROWSERS_PATH=.browsers`，再执行安装命令。日常使用推荐跨平台的 `npm run setup`，无需手动设置环境变量；`npm run demo` 也通过 Node 脚本跨平台设置演示参数。Linux 若缺少系统共享库，需要用户自行准备 Playwright 支持的系统环境，本项目不会自动执行系统级安装。

`.env.example` 仅作说明，不需要复制；应用不自动读取 `.env`。运行时可用终端环境变量 `PLAYWRIGHT_BROWSERS_PATH` 指向已有兼容缓存，默认是项目内 `.browsers`。`setup` 始终只安装到本项目目录。如果此前覆盖过缓存变量，运行前请清除覆盖或指向正确的已安装路径。

## 三步演示

1. **开始扫描**：真实浏览器先点击「预览笔记」「保存草稿」，再点击「导出报告」。日志逐项展示实际执行结果。
2. **复现异常**：看到「导出失败：报告数据未定义」后点击。程序另起浏览器运行，在新上下文中重放 `#export`，核对相同错误，展示两次时间戳。
3. **观看复现录像**：播放真实示例页面录像；也可切回截图或在新窗口打开录像。原始浏览器调用栈保持原样。

扫描阶段也会在第二个上下文中先确认候选异常。用户点击「复现异常」后进行的是另一轮独立验证，并非重播预制数据。首页包含操作引导；Tab 可聚焦「跳到开始扫描」，Enter 可开始操作，运行期间按钮禁用。手机宽度下内容按单列显示。

## 依赖说明

精确版本以 `package-lock.json` 为准，使用 `npm ci` 可按锁文件重建，勿用删除锁文件的方式处理安装问题。

| 依赖 | 作用 |
| --- | --- |
| React、React DOM | 中文交互界面与状态展示 |
| Express | 本地 API、内置示例和证据文件服务 |
| lucide-react | 界面图标，不访问远程图标服务 |
| TypeScript、相关 @types 包 | 类型检查和开发类型定义 |
| Vite、@vitejs/plugin-react | 开发服务、代理与前端构建 |
| tsx、concurrently | 运行 TypeScript 后端，同时启动前后端 |
| @playwright/test **1.59.0** | 真实浏览器探索、端到端测试和演示录像 |
| Vitest | 目标限制与诊断脚本单元测试 |
| Chromium 无头浏览器 **1217** | Playwright 对应的隔离浏览器，独立下载到项目缓存 |
| FFmpeg **1011** | Playwright 对应的 WebM 录像组件，独立安装 |

无需 Python、Docker、全局 Playwright 或 API Key。脚本使用 Node 内置模块，安装诊断不会依赖未安装的第三方包。浏览器二进制是平台相关组件，不能直接把 macOS 缓存复制到 Windows 使用。

## 故障恢复

- **依赖缺失／与锁文件不一致**：运行 `npm run doctor` 查看提示，再运行 `npm run setup`。安装失败不会被报告为成功；检查网络后重试。
- **找不到浏览器或录像组件**：运行 `npm run setup`，或按上述手动命令安装；确认运行时缓存变量与安装路径一致。
- **4204 或 5204 已占用**：如果是自己已启动的 BugCam，回到原终端按 Ctrl+C；如果属于其他程序，由用户确认后关闭。本工具不强制杀进程，也不静默更换端口。测试前必须先停止开发服务。
- **无法连接本地服务**：确认 `npm run dev` 终端仍运行，访问健康检查地址。再运行 doctor，恢复后点击开始／重新扫描。
- **30 秒超时或本轮未复现**：查看中文提示和原始技术详情，重试扫描；未复现不会显示成功。仅有 console.error 或失败请求不算确认缺陷。
- **旧运行无法重放**：重启 API 会清空内存索引，请重新扫描。旧证据文件仍在 `artifacts/hunts/`。
- **磁盘空间**：停止服务后可手动清理旧 `artifacts/hunts/`。项目不自动清理证据，不提交证据或缓存到 Git。

## 真实验证与证据

先停止 `npm run dev`，测试会自动启动和关闭本地服务：

```sh
npm run build
npm run test
npm run e2e
npm run demo
npm run doctor
```

本轮实际结果：构建通过、10 项单元测试通过、5 项 E2E 通过、独立 demo 通过；setup 与正常 doctor 返回 0，缺依赖 doctor 按预期返回 1。

验证包括精确中文错误、三次真实控件操作、自动确认、独立运行 ID 与不同时间戳、截图／视频字节、录像可播放、并发拒绝、远程目标及外部来源拒绝。另验证小屏无横向溢出、中文页面语言、键盘操作和网络失败恢复提示。网络失败测试主动中断测试请求，不会伪造成功记录。

证据保留在本机，不进入仓库：

- `artifacts/logs/*-zh.log`：中文版本验证日志；`doctor-missing-zh.log`：缺依赖路径的真实 CLI 诊断。
- `artifacts/demo-crash.png`、`artifacts/mobile-zh.png`：中文桌面与小屏截图。
- `artifacts/playwright/demo/`、`artifacts/playwright/e2e/`：真实界面录像及截图。
- `artifacts/hunts/<运行 ID>/result.json`：真实异常、截图和录像索引。
- `status.json`：本轮真实结果、限制和证据引用。

历史故障也保留：初版缺少匹配浏览器；后续 Node 26 上可选 trace 压缩收尾超时。已固定 Playwright 版本、使用匹配缓存，并关闭可选 trace 压缩；真实截图和录像仍保留。对应旧日志在 `artifacts/logs/e2e-initial-missing-browser.log` 和 `e2e-trace-teardown-timeout.log`。

本轮中文验证曾发现扫描完成状态早于录像收尾、桌面面板超出 2 像素；已修复并重跑通过，失败日志保留在 `e2e-zh-initial-race.log` 和 `e2e-zh-layout-overflow.log`。

## 范围与未验证项

- 仅内置故障示例，最多 8 个带安全 ID 的可见控件，单击序列探索；不包含复杂表单、多步业务、登录或未知生产缺陷发现。
- 单次运行限时 30 秒，另加浏览器关闭与证据写入；仅允许一个任务运行，浏览器请求限制到示例路径。
- 最近 50 次运行索引在内存中，不是持久任务系统。页面异常是检测依据，没有业务正确性判断器。
- 本机回环地址不等于多用户安全隔离；不要通过隧道对外开放。恶意本机进程不在威胁模型内。
- 本轮使用 macOS、Node 26.4.0 和已有匹配浏览器缓存。`setup` 会实际执行锁定依赖安装并复用浏览器；**空缓存全量下载、Windows、Linux 和 Node 22 均未独立验证**。
- 没有模型推理、遥测或用户凭据读取。MIT 许可证法律原文见 LICENSE。
