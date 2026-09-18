import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('ERROR', e.message));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('[data-world-layer]')?.dataset.worldStatus === 'ready', undefined, { timeout: 20000 });
await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]'), undefined, { timeout: 20000 });
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.mouse.move(720, 450);
await page.waitForTimeout(1500);

const geo = await page.evaluate(() => {
    const layer = document.querySelector('[data-world-layer]');
    const s = document.querySelector('[data-hero-figure-slot]').getBoundingClientRect();
    const box = layer.dataset.figureBox.split(',').map(Number);
    return {
        slot: { left: Math.round(s.left), right: Math.round(s.right), cx: Math.round(s.left + s.width / 2), cy: Math.round(s.top + s.height / 2), w: Math.round(s.width), h: Math.round(s.height) },
        box: { left: box[0], top: box[1], right: box[2], bottom: box[3], cx: Math.round((box[0] + box[2]) / 2), cy: Math.round((box[1] + box[3]) / 2) },
        natural: layer.dataset.figureNatural,
        yaw: layer.dataset.figureYaw,
    };
});
console.log('slot   ', JSON.stringify(geo.slot));
console.log('box    ', JSON.stringify(geo.box));
console.log('natural (w,h,centreY) =', geo.natural, ' yaw =', geo.yaw);
console.log(`drift x=${geo.box.cx - geo.slot.cx}  y=${geo.box.cy - geo.slot.cy}`);

// Does clicking the slot actually reach the world?
console.log('\nsquash before click:', await page.locator('[data-world-layer]').getAttribute('data-figure-squash'));
await page.locator('[data-hero-figure-slot]').click();
for (const wait of [80, 120, 200, 400]) {
    await page.waitForTimeout(wait);
    console.log(`  +${wait}ms squash=${await page.locator('[data-world-layer]').getAttribute('data-figure-squash')}`);
}
const handler = await page.evaluate(() => {
    const slot = document.querySelector('[data-hero-figure-slot]');
    return { pointerEvents: getComputedStyle(slot).pointerEvents, topAtCentre: (() => {
        const r = slot.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return el ? `${el.tagName}[${el.dataset.heroFigureSlot !== undefined ? 'slot' : el.className.toString().slice(0, 40)}]` : 'none';
    })() };
});
console.log('\nslot pointer-events:', handler.pointerEvents, ' element at slot centre:', handler.topAtCentre);
await browser.close();
