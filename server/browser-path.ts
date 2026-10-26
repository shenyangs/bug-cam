import { resolve } from 'node:path';
// Keep downloaded browser binaries inside this project; allow an explicit override.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve('.browsers');
