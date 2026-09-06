// Scrolls the page the way a person would (wheel steps, not jumps) and then
// reports any element still visually hidden — zero opacity, or translated out
// of an overflow-hidden mask.
//
// Scroll-triggered reveals fail open in the worst way: if the observer misses,
// the content stays invisible forever with its layout space still reserved,
// which looks like a blank gap rather than an obvious error.
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5174';
const WIDTH = Number(process.argv[3] ?? 390);

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 768 ? 800 : 900 },
    hasTouch: WIDTH < 768,
    isMobile: WIDTH < 768,
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => window.sessionStorage.setItem('intro-played', '1'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Human-ish scroll: many small wheel steps all the way down.
const total = await page.evaluate(() => document.documentElement.scrollHeight);
let y = 0;
while (y < total) {
    await page.mouse.wheel(0, 400);
    y += 400;
    await page.waitForTimeout(70);
}
await page.waitForTimeout(1500);

// Back to the top, then settle.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

const hidden = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('main *, footer *')) {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (style.visibility === 'hidden' || style.display === 'none') continue;

        // Deliberately collapsed regions are not failed reveals. `inert` is the
        // marker rather than an allowlist: it means the content is
        // intentionally out of the tab order and the a11y tree, which is
        // exactly what a closed disclosure panel is. The work section's
        // "Approach, stack & code" panels stay mounted while collapsed so
        // crawlers still see the repository links.
        if (el.closest('[inert]')) continue;

        const text = (el.textContent ?? '').trim().slice(0, 45);
        if (!text) continue;

        const opacity = Number.parseFloat(style.opacity);
        const transform = style.transform;

        // A big Y translate inside a masked parent means the text is parked
        // off-screen waiting for a reveal that never came.
        let translatedY = 0;
        if (transform && transform !== 'none') {
            const m = transform.match(/matrix\(([^)]+)\)/);
            if (m) translatedY = Math.abs(Number.parseFloat(m[1].split(',')[5]));
            const m3 = transform.match(/matrix3d\(([^)]+)\)/);
            if (m3) translatedY = Math.abs(Number.parseFloat(m3[1].split(',')[13]));
        }

        if (opacity < 0.05 || translatedY > 12) {
            out.push({
                tag: el.tagName.toLowerCase(),
                opacity: opacity.toFixed(2),
                translatedY: Math.round(translatedY),
                text,
            });
        }
    }
    return out;
});

console.log(`\n=== ${WIDTH}px : elements still hidden after a full scroll ===`);
if (!hidden.length) console.log('  none — every reveal completed');
for (const h of hidden) {
    console.log(`  <${h.tag}> opacity=${h.opacity} translateY=${h.translatedY}px  "${h.text}"`);
}
console.log(`\n${hidden.length} hidden element(s)`);

await browser.close();
process.exit(hidden.length ? 1 : 0);
