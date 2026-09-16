import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

// Close-up renders of the hero figure, at 2x so the clay shading is actually
// judgeable. Also captures the assembly beats, because the figure looks
// different mid-flight than it does at rest.
const BASE = process.argv[2] ?? 'http://localhost:5175';
const TAG = process.argv[3] ?? 'figure';

await mkdir('refs', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.on('pageerror', (error) => console.log('ERROR', error.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(
    () => document.querySelector('[data-world-layer]')?.dataset.worldStatus === 'ready',
    undefined,
    { timeout: 20000 },
);
await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]'), undefined, { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
// Let the greeting wave finish so the arm is down for the portrait shots.
await page.waitForTimeout(3200);

const slot = await page.locator('[data-hero-figure-slot]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
});
// Pad generously: the projected box is wider than the slot and the head sits
// above it.
const clip = {
    x: Math.max(0, Math.round(slot.x - 90)),
    y: Math.max(0, Math.round(slot.y - 130)),
    width: Math.round(slot.width + 180),
    height: Math.round(slot.height + 170),
};

for (const [name, x, y] of [['front', 720, 420], ['left', 180, 420], ['right', 1300, 420], ['down', 720, 860]]) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `refs/${TAG}-${name}.png`, clip });
    console.log(`ok    refs/${TAG}-${name}.png (cursor ${x},${y})`);
}

const info = await page.locator('[data-world-layer]').evaluate((el) => ({
    box: el.dataset.figureBox,
    assembly: el.dataset.figureAssembly,
    yaw: el.dataset.figureYaw,
}));
console.log(`\nfigure ${JSON.stringify(info)}`);
await browser.close();
