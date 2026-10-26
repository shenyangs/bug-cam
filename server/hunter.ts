import './browser-path';
import { chromium, type Browser } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
export const TARGET = 'http://127.0.0.1:5204/fixture/';
export function validateTarget(target: unknown) {
  if (target !== undefined && target !== TARGET) throw new Error('Only the bundled local fixture is allowed');
  return TARGET;
}
export type Attempt = { label:string; locator:string; timestamp:string; errors:string[]; consoleErrors:string[]; failedRequests:string[]; stack:string; screenshot:string; video:string };
export type Run = { id:string; kind:'scan'|'reproduce'; state:'running'|'complete'|'failed'; startedAt:string; finishedAt?:string; attempts:Attempt[]; issue?:Attempt; confirmation?:Attempt; message?:string; reproduced?:boolean; sourceId?:string };
export const runs = new Map<string,Run>();
let busy = false;
export function startRun(kind:Run['kind'], source?:Run) {
  if (busy) throw new Error('A browser run is already active');
  busy = true;
  const run:Run = {id:randomUUID(), kind, state:'running', startedAt:new Date().toISOString(), attempts:[], sourceId:source?.id};
  runs.set(run.id,run);
  if (runs.size > 50) runs.delete(runs.keys().next().value!);
  void execute(run, source).finally(() => {busy=false;});
  return run;
}
async function attempt(browser:Browser, run:Run, locator:string, label:string):Promise<Attempt> {
  const folder = resolve('artifacts/hunts',run.id);
  await mkdir(folder,{recursive:true});
  const context = await browser.newContext({ viewport:{width:1100,height:720}, recordVideo:{dir:folder, size:{width:1100,height:720}} });
  await context.route('**/*',route => route.request().url().startsWith(TARGET) ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(2200);
  const a:Attempt = {label,locator,timestamp:new Date().toISOString(),errors:[],consoleErrors:[],failedRequests:[],stack:'',screenshot:'',video:''};
  page.on('pageerror', e=>{a.errors.push(e.message); a.stack=e.stack ?? e.message;});
  page.on('console', m=>{if(m.type()==='error')a.consoleErrors.push(m.text());});
  page.on('requestfailed',r=>a.failedRequests.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  try {
    await page.goto(TARGET,{waitUntil:'load',timeout:3000});
    await page.waitForTimeout(400);
    await page.locator(locator).click();
    await page.waitForTimeout(600);
    const name = `${randomUUID()}.png`;
    await page.screenshot({path:resolve(folder,name)});
    a.screenshot=`/api/artifacts/${run.id}/${name}`;
  } finally {
    const video=page.video();
    await context.close();
    if(video) a.video=`/api/artifacts/${run.id}/${basename(await video.path())}`;
  }
  return a;
}
async function execute(run:Run,source?:Run) {
  let browser:Browser|undefined;
  let expired=false;
  const deadline=setTimeout(()=>{expired=true; void browser?.close();},30_000);
  try {
    browser=await chromium.launch({headless:true,timeout:8000});
    if(expired) throw new Error('30 second hunt deadline exceeded');
    if(source?.issue) {
      const a=await attempt(browser,run,source.issue.locator,source.issue.label);
      run.attempts.push(a); run.issue=a;
      run.reproduced=a.errors.includes(source.issue.errors[0]);
    } else {
      const context=await browser.newContext();
      await context.route('**/*',r=>r.request().url().startsWith(TARGET)?r.continue():r.abort());
      const page=await context.newPage();
      await page.goto(TARGET,{timeout:3000});
      const controls=await page.locator('button, a[href], input[type=button], input[type=submit]').evaluateAll(nodes=>nodes.filter(n=>(n as HTMLElement).offsetWidth>0 && (n as HTMLElement).offsetHeight>0).slice(0,8).map((n)=>({label:n.textContent?.trim() || 'Control',id:n.id})));
      await context.close();
      for(const c of controls) {
        if(!/^[a-zA-Z][\w-]*$/.test(c.id)) continue;
        const a=await attempt(browser,run,`#${c.id}`,c.label);
        run.attempts.push(a);
        if(a.errors.length) {
          const check=await attempt(browser,run,a.locator,a.label);
          run.confirmation=check;
          if(check.errors.includes(a.errors[0])) {run.issue=a; break;}
        }
      }
    }
    if(expired) throw new Error('30 second hunt deadline exceeded');
    run.state='complete';
  } catch(e) {run.state='failed';run.message=expired?'30 second hunt deadline exceeded':(e as Error).message;}
  finally {
    clearTimeout(deadline);
    await browser?.close().catch(()=>{});
    run.finishedAt=new Date().toISOString();
    await mkdir(resolve('artifacts/hunts',run.id),{recursive:true});
    await writeFile(resolve('artifacts/hunts',run.id,'result.json'),JSON.stringify(run,null,2));
  }
}
