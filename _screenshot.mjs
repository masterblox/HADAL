import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 4000 } });

  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/?bypass', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(__dirname, '_shot_react.png'), fullPage: true });
  console.log('Full-page screenshot saved');

  await browser.close();
})();
