# A04 — BugCam

Build a browser crash hunter with ACTUAL autonomous bounded exploration and a REAL recorded repro, scoped to a bundled local demo app. Read ./AGENTS.md. One P0 only.

## Stack / constraints
- Node + Playwright + React viewer. Own `fixtures/buggy-site` with at least one genuine JavaScript pageerror thrown by interacting with a buggy button. No remote domain scanner.
- `/api/scan` launches isolated Chromium, visits only 127.0.0.1 fixture page, enumerates up to 8 visible clickable controls; for each, new context, click, collect `pageerror`, failed requests and console.error; enforce max 30 seconds. Capture error message, locator used, screenshot and video/trace. Stop on first reproducible issue.
- `/api/reproduce` opens fresh context and replays the recorded minimal click sequence. Never claim to discover business logic bugs without an oracle.

## P0 happy path
1. UI shows `Target: Local test site` and Start Hunt.
2. Real browser clicks controls; timeline shows each attempted action. A deliberate code bug throws; UI turns red with exact browser error, real selector, steps.
3. Reproduce button runs fresh browser and triggers same error. Display screenshot/video artifact and both timestamps.

## Must prove
- E2E clicks Hunt, finds seeded bug, checks exact message, clicks Reproduce, verifies same error is observed on second independent run.
- Unit test scan rejects `https://example.org` and user-provided remote URLs.
- Demo test records visible browser run and artifact screenshot/video.
- README says 'bounded local demo crash detection', not arbitrary production bug finding.

## X hook
'I gave a browser agent a buggy page. It clicked around, found a real crash, and recorded the repro.' Show live locator -> red stack -> second reproduction.


Execute within this directory only. Run npm install, implement, then build/test/e2e/demo. Preserve real logs and status.json.

This is an authorized independent sprint execution. Start implementing now, no confirmation. Do not spawn subagents. All writes limited to this app directory; use npm install --cache .npm-cache and keep .npm-cache ignored. Existing Playwright browsers may be read from ~/Library/Caches/ms-playwright; if install required use PLAYWRIGHT_BROWSERS_PATH inside this project. Install dependencies, replace starter tests with meaningful behavior tests, run build/test/e2e/demo and preserve actual logs, screenshot and video. Do not read user credentials or other project data. Missing model keys: runnable clearly labelled fixture and PARTIAL status. Add LICENSE. Verify and finish, not merely plan.
