import {test, expect} from '@playwright/test';
test('record a real BugCam hunt and replay', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Start Hunt',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Export failed: report payload is undefined',exact:true})).toBeVisible({timeout:35_000});
  await page.waitForTimeout(1000);
  await page.getByRole('button',{name:'Reproduce',exact:true}).click();
  await expect(page.getByTestId('repro-result')).toContainText('Same error reproduced',{timeout:35_000});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(810);
  await page.screenshot({path:'artifacts/demo-crash.png',fullPage:true});
  await page.getByRole('button',{name:'Watch recorded repro'}).click();
  await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThan(0);
  await page.waitForTimeout(2500);
});
