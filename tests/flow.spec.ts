import {test, expect} from '@playwright/test';
test('real browser discovery and independent reproduction', async ({page,request})=>{
  await page.goto('/');
  await expect(page.getByText('Target: Local test site')).toBeVisible();
  const started=page.waitForResponse(r=>r.url().endsWith('/api/scan')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Start Hunt',exact:true}).click();
  const scanId=(await (await started).json()).id;
  expect((await request.post('/api/scan',{data:{}})).status()).toBe(409);
  await expect(page.getByRole('heading',{name:'Export failed: report payload is undefined',exact:true})).toBeVisible({timeout:35_000});
  await expect(page.getByText('Preview notes',{exact:true})).toBeVisible();
  await expect(page.getByText('Save draft',{exact:true})).toBeVisible();
  await expect(page.getByText('#export',{exact:true}).first()).toBeVisible();
  const replayed=page.waitForResponse(r=>r.url().endsWith('/api/reproduce')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Reproduce',exact:true}).click();
  const replayId=(await (await replayed).json()).id;
  await expect(page.getByTestId('repro-result')).toHaveText('✓ Same error reproduced in a fresh context',{timeout:35_000});
  const scan=await (await request.get(`/api/runs/${scanId}`)).json();
  const replay=await (await request.get(`/api/runs/${replayId}`)).json();
  expect(scan.attempts).toHaveLength(3);
  expect(scan.confirmation.errors).toEqual(['Export failed: report payload is undefined']);
  expect(replay.id).not.toBe(scan.id);
  expect(replay.issue.timestamp).not.toBe(scan.issue.timestamp);
  expect(replay.issue.errors).toEqual(scan.issue.errors);
  for(const path of [replay.issue.screenshot,replay.issue.video]){const result=await request.get(path);expect(result.ok()).toBeTruthy();expect((await result.body()).length).toBeGreaterThan(1000);}
  await page.getByRole('button',{name:'Watch recorded repro'}).click();
  await expect(page.locator('video')).toBeVisible();
  await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThan(0);
  await page.screenshot({path:'artifacts/verified-flow.png',fullPage:true});
});
test('API denies remote targets and invalid reproduction',async({request})=>{
  for(const target of ['https://example.org','http://127.0.0.1:5204/fixture/?url=https://example.org']) {
    const response=await request.post('/api/scan',{data:{target}});expect(response.status()).toBe(400);
  }
  expect((await request.post('/api/reproduce',{data:{runId:'nonexistent'}})).status()).toBe(400);
  expect((await request.post('/api/scan',{headers:{origin:'https://example.org'},data:{}})).status()).toBe(403);
});
