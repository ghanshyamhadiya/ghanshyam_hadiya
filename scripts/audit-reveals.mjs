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
await page.waitForFunction(() => !document.querySelector('[data-intro-overlay], [data-intro-curtain]'), null, { timeout: 12000 });

// Human-ish scroll: many small wheel steps all the way down.
const total = await page.evaluate(() => document.documentElement.scrollHeight);
let y = 0;
while (y < total) {
    await page.mouse.wheel(0, 400);
    y += 400;
    await page.waitForTimeout(70);
}
await page.waitForTimeout(1500);

const scrubbed = await page.locator('h2[data-scroll-heading]').evaluateAll((headings) => headings.map((h) => h.id));
const verified = [];
const stageFailures = [];
const bridge = await page.evaluate(() => Boolean(document.querySelector('script[src*="/@vite/client"]')));
for (const id of scrubbed) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const target = await page.locator(`#${id}`).evaluate((h) => {
            const r = h.getBoundingClientRect();
            const top = innerHeight * 0.525 - r.height / 2;
            return { delta: r.top - top, offset: -top };
        });
        if (Math.abs(target.delta) < 1) break;
        if (bridge) {
            await page.evaluate(async ({ id, offset }) => {
                const { scrollToSection } = await import('/src/utils/smoothScroll.js');
                scrollToSection(id, { offset, immediate: true });
            }, { id, offset: target.offset });
        } else await page.mouse.wheel(0, target.delta);
        await page.waitForTimeout(bridge ? 250 : 1400);
    }
    const readable = await page.locator(`#${id}`).evaluate((heading) => {
        const visual = heading.querySelector('[data-scroll-heading-visual][aria-hidden="true"]');
        const semantic = heading.querySelector('.sr-only');
        const section = heading.closest('section');
        const label = section?.querySelector('[data-heading-label]');
        const normalize = (text) => text?.replace(/\s+/g, ' ').trim();
        if (!visual || !semantic || !label?.textContent.trim() ||
            !section.getAttribute('aria-labelledby')?.split(/\s+/).includes(heading.id) ||
            normalize(visual.textContent) !== normalize(semantic.textContent)) return false;
        const glyphs = [...visual.querySelectorAll('[data-heading-glyph]')];
        return glyphs.length > 0 && glyphs.every((glyph) => {
            const range = document.createRange();
            range.selectNodeContents(glyph);
            const r = range.getBoundingClientRect();
            if (r.width < 0.5 || r.height < 8 || r.left < -2 || r.right > innerWidth + 2 || r.top < -2 || r.bottom > innerHeight + 2) return false;
            for (let node = glyph; node; node = node.parentElement) {
                const style = getComputedStyle(node);
                const bounds = node.getBoundingClientRect();
                if (Number(style.opacity) < 0.95 || style.visibility === 'hidden' || style.display === 'none') return false;
                if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (r.left < bounds.left - 2 || r.right > bounds.right + 2)) return false;
                if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (r.top < bounds.top - 2 || r.bottom > bounds.bottom + 2)) return false;
            }
            return true;
        });
    });
    if (readable) verified.push(id);
    else stageFailures.push({ tag: 'h2', opacity: 'unknown', translatedY: 0, text: `${id}: not readable at its scroll reading position` });
}
console.log(`${verified.length}/${scrubbed.length} scroll-controlled headings verified at their reading positions`);

// Back to the top, then settle.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

const hidden = await page.evaluate((verified) => {
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
        const scrollVisual = el.closest('[data-scroll-heading-visual][aria-hidden="true"]');
        if (scrollVisual && verified.includes(scrollVisual.closest('h2[data-scroll-heading]')?.id)) continue;

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
}, verified);
hidden.push(...stageFailures);

console.log(`\n=== ${WIDTH}px : elements still hidden after a full scroll ===`);
if (!hidden.length) console.log('  none — every reveal completed');
for (const h of hidden) {
    console.log(`  <${h.tag}> opacity=${h.opacity} translateY=${h.translatedY}px  "${h.text}"`);
}
console.log(`\n${hidden.length} hidden element(s)`);

await browser.close();
process.exit(hidden.length ? 1 : 0);
