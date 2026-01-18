import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  await page.waitForSelector('textarea');
  
  await page.fill('textarea', '用 Recharts 制作一个展示冒泡排序步骤的交互式动画，并使用中文解释');
  await page.press('textarea', 'Enter');
  
  console.log('Waiting for generation...');
  await page.waitForTimeout(30000); 
  
  await page.screenshot({ path: 'output-screenshot.png', fullPage: true });
  
  console.log('Screenshot taken: output-screenshot.png');
  
  await browser.close();
})();
