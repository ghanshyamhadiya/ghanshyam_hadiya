// Captures the first-load sequence frame by frame, so the intro can be
// eyeballed rather than inferred from numbers.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5174';
const OUT = process.argv[3] ?? 'shots/intro';
const WIDTH = Number(process.argv[4] ?? 1440);

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 768 ? 800 : 900 },
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });

const t0 = Date.now();
for (let i = 0; i < 12; i += 1) {
    const t = Date.now() - t0;
    await page.screenshot({ path: `${OUT}/${String(t).padStart(4, '0')}ms.png` });
    await page.waitForTimeout(180);
}

await browser.close();
console.log(`intro frames written to ${OUT}/`);
