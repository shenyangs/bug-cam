# BugCam

**Find the crash. Keep the proof.**

“I gave a browser agent a buggy page. It clicked around, found a real crash, and recorded the repro.”

BugCam is **bounded local demo crash detection**. A deterministic heuristic drives real Chromium through a bundled, deliberately buggy page. No LLM inference or API key is used. The fixture is seeded; browser execution, exception capture, screenshots, and videos are real.

## Run locally

Requires Node.js 22+, npm, and a supported Playwright Chromium host. All app dependencies are local to this repository.

```sh
npm ci --cache .npm-cache
PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright install chromium
npm run dev
```

Open http://127.0.0.1:4204. API is fixed to 127.0.0.1:5204. Both servers bind only to loopback. Browser lookup defaults to this repository's `.browsers`; an explicit `PLAYWRIGHT_BROWSERS_PATH` environment variable can override it. On Windows PowerShell set `$env:PLAYWRIGHT_BROWSERS_PATH='.browsers'` before running `npx playwright install chromium`. No `.env` or model credentials are needed; `.env.example` documents the mode.

## Three-click demo

1. Click **Start Hunt**. The real browser enumerates up to eight visible controls, opens a fresh context for each click, and visits Preview notes, Save draft, then Export report.
2. Click **Reproduce** after the crash appears. A new Chromium process and context replay `#export` and compare the exact page error: `Export failed: report payload is undefined`.
3. Click **Watch recorded repro**. Watch the actual target-page video beside the stack and separate detection/replay timestamps.

The scan already confirms its first candidate in another fresh context before reporting it. The explicit Reproduce action independently verifies it again. Each run has its own UUID and JSON evidence. UI actions poll actual run state; there are no invented timeline events or scores.

## Verification and evidence

Stop `npm run dev` before these commands; tests start and stop their own local servers.

```sh
npm run build
npm run test
npm run e2e
npm run demo
```

- Unit tests: exact target validation, including remote URLs, traversal-like targets, file URLs, and malformed input.
- E2E: real hunt, exact exception, three actual control attempts, automatic confirmation, explicit reproduction with distinct run ID/timestamp, screenshot/video bytes, playable video, concurrency rejection, cross-origin rejection, and invalid replay rejection.
- Demo: real UI hunt/replay captured at 1440×810 with screenshot and video.
- Local evidence: `artifacts/logs/`, `artifacts/playwright/e2e/`, `artifacts/playwright/demo/`, `artifacts/demo-crash.png`, `artifacts/verified-flow.png`, and `artifacts/hunts/<run-id>/result.json` with real screenshots/videos.

Initial E2E failed because the matching Chromium binary was missing. `artifacts/logs/e2e-initial-missing-browser.log` preserves that failure. Playwright is now pinned to 1.59.0; the final validation reused its matching Chromium 1217 and FFmpeg 1011 cache read-only, copied inside `.browsers`. Fresh installs use the browser installation command above. A subsequent run timed out during optional trace archive teardown on Node 26; `artifacts/logs/e2e-trace-teardown-timeout.log` preserves that failure. Trace compression is disabled; real screenshot and video capture remain enabled. After these fixes, final command outcomes are recorded in `status.json`. Evidence and downloaded browsers are intentionally excluded from Git.

Final verification: build passed; 8 unit tests passed; 3 E2E tests passed; 1 independent demo test passed. The demo verifies the completed proof panel fits a 1440×810 viewport. Local verification used macOS and Node 26.4.0; other platforms and Node 22 were not independently exercised.

## Boundaries and limitations

- Status is **PARTIAL** for the AI sprint: the browser workflow works, but this is heuristic exploration without model inference. No AI-generated reasoning is claimed.
- Only the exact bundled local fixture is accepted. There is no arbitrary URL scanner, production-site support, authentication, or business-logic oracle.
- A JavaScript `pageerror` repeated on fresh load is the crash oracle. Console errors and failed requests are collected as evidence, but alone do not establish a bug.
- Single-click sequences only; up to eight visible button/link controls with safe IDs. Complex flows, forms, and hidden controls are outside this MVP. Each candidate is tested in isolation.
- Maximum run deadline is 30 seconds, plus browser shutdown/evidence flush. Navigation/click timeouts are shorter. Only one run is active at once. Browser requests are restricted to the fixed fixture URL prefix.
- Last 50 run records are kept in memory. Restarting the API loses replay lookup, while evidence files remain on disk. There is no automatic evidence retention cleanup; remove old `artifacts/hunts` files when no run is active.
- Loopback is a local development boundary, not a multi-user security system. Do not expose these services through a tunnel. Hostile local processes are outside the threat model.
- The demo page intentionally throws an error. This demonstrates browser crash detection, not discovery of an unknown production defect.

MIT licensed. No telemetry, user files, user credentials, or external model calls.
