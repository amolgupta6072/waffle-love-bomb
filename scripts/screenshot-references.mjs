// Captures screenshots of reference websites for design review.
// Runs in GitHub Actions (see .github/workflows/screenshot-references.yml).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SITES = [
  ['ethos-home', 'https://www.ethoswatches.com/'],
  ['ethos-brand', 'https://www.ethoswatches.com/omega'],
  ['timeandtide-home', 'https://timeandtidewatches.com/'],
  ['watchbandit-home', 'https://watchbandit.com/'],
  ['minora-home', 'https://minorawatches.com/'],
  ['mvs-microbrands', 'https://mvswatches.com/microbrand-watches/'],
];

mkdirSync('docs/reference', { recursive: true });
const browser = await chromium.launch();
for (const [name, url] of SITES) {
  for (const [suffix, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({
      viewport,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(5000);
      // Dismiss common cookie / newsletter popups.
      for (const label of ['Accept', 'Accept all', 'I agree', 'Got it', 'Close', 'No thanks']) {
        await page.getByRole('button', { name: label, exact: false }).first().click({ timeout: 800 }).catch(() => {});
      }
      await page.keyboard.press('Escape').catch(() => {});
      // Scroll through once so lazy images load.
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < Math.min(height, 9000); y += 700) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(250);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      const shots = suffix === 'desktop' ? 4 : 3;
      for (let i = 0; i < shots; i++) {
        await page.evaluate((v) => window.scrollTo(0, v), i * viewport.height);
        await page.waitForTimeout(600);
        await page.screenshot({ path: `docs/reference/${name}-${suffix}-${i + 1}.jpg`, type: 'jpeg', quality: 70 });
      }
      console.log(`ok ${name} ${suffix}`);
    } catch (err) {
      console.log(`failed ${name} ${suffix}: ${err.message}`);
    }
    await page.close();
  }
}
await browser.close();
