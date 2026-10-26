import {test, expect} from '@playwright/test';
test('record a real BugCam hunt and replay', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'开始扫描',exact:true}).click();
  await expect(page.getByRole('heading',{name:'导出失败：报告数据未定义',exact:true})).toBeVisible({timeout:35_000});
  await page.waitForTimeout(1000);
  await page.getByRole('button',{name:'复现异常',exact:true}).click();
  await expect(page.getByTestId('repro-result')).toContainText('已在全新上下文中复现相同异常',{timeout:35_000});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(810);
  await page.screenshot({path:'artifacts/demo-crash.png',fullPage:true});
  await page.getByRole('button',{name:'观看复现录像'}).click();
  await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThan(0);
  await page.waitForTimeout(2500);
});
