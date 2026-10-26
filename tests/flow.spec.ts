import {test, expect} from '@playwright/test';
test('real browser discovery and independent reproduction', async ({page,request})=>{
  await page.goto('/');
  await expect(page.getByText('扫描目标：本地测试页面')).toBeVisible();
  const started=page.waitForResponse(r=>r.url().endsWith('/api/scan')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'开始扫描',exact:true}).click();
  const scanId=(await (await started).json()).id;
  expect((await request.post('/api/scan',{data:{}})).status()).toBe(409);
  await expect(page.getByRole('heading',{name:'导出失败：报告数据未定义',exact:true})).toBeVisible({timeout:35_000});
  await expect(page.getByText('预览笔记',{exact:true})).toBeVisible();
  await expect(page.getByText('保存草稿',{exact:true})).toBeVisible();
  await expect(page.getByText('#export',{exact:true}).first()).toBeVisible();
  const replayed=page.waitForResponse(r=>r.url().endsWith('/api/reproduce')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'复现异常',exact:true}).click();
  const replayId=(await (await replayed).json()).id;
  await expect(page.getByTestId('repro-result')).toHaveText('✓ 已在全新上下文中复现相同异常',{timeout:35_000});
  const scan=await (await request.get(`/api/runs/${scanId}`)).json();
  const replay=await (await request.get(`/api/runs/${replayId}`)).json();
  expect(scan.attempts).toHaveLength(3);
  expect(scan.confirmation.errors).toEqual(['导出失败：报告数据未定义']);
  expect(replay.id).not.toBe(scan.id);
  expect(replay.issue.timestamp).not.toBe(scan.issue.timestamp);
  expect(replay.issue.errors).toEqual(scan.issue.errors);
  for(const path of [replay.issue.screenshot,replay.issue.video]){const result=await request.get(path);expect(result.ok()).toBeTruthy();expect((await result.body()).length).toBeGreaterThan(1000);}
  await page.getByRole('button',{name:'观看复现录像'}).click();
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
test('中文小屏、键盘入口和真实扫描',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'跳到开始扫描'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'开始扫描',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'导出失败：报告数据未定义',exact:true})).toBeVisible({timeout:35_000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:'artifacts/mobile-zh.png',fullPage:true});
});
test('网络失败时提供中文恢复提示',async({page})=>{
  await page.goto('/');
  await page.route('**/api/scan',r=>r.abort('connectionrefused'));
  await page.getByRole('button',{name:'开始扫描',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('无法连接本地服务。请运行 npm run doctor');
  await expect(page.getByRole('button',{name:'开始扫描',exact:true})).toBeEnabled();
});
