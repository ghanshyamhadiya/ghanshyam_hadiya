import { chromium } from 'playwright';

// The mandatory guard for putting the WebGL canvas ABOVE the document.
//
// That choice is what lets the clay figure stand in front of a real <h1>
// instead of forcing the name into a texture. The price is that any geometry
// can silently cover body copy, so this asserts the opposite: every run of
// text on the page is measured against the canvas's actual painted alpha, at
// several scroll positions and viewport sizes.
//
// The hero name is the one deliberate exception. It must be partly covered —
// that is the whole composition — but it must also stay readable, so it is
// checked against a band rather than exempted.
const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
if (!['normal', 'reduced'].includes(MODE) || !Number.isInteger(WIDTH) || WIDTH < 320) {
    throw new Error('Usage: node scripts/audit-occlusion.mjs BASE WIDTH normal|reduced');
}

// A glyph sitting under a couple of percent of stray antialiasing is not
// covered in any way a reader would notice.
const CLEAR = 0.02;
const NAME_MIN = 0.02;
const NAME_MAX = 0.4;

let failures = 0;
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};
const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 768 ? 844 : 900 },
    reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

// Ink rects for every visible run of text, split per line box so a wrapped
// paragraph is judged line by line rather than as one loose rectangle.
const sample = () => page.evaluate(() => {
    const layer = document.querySelector('[data-world-layer]');
    if (!layer?.probeCoverage) return null;
    const heroName = document.querySelector('#home h1');
    const targets = [];
    const walker = document.createTreeWalker(document.getElementById('main'), NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        if (!node.textContent.trim()) continue;
        const parent = node.parentElement;
        if (!parent || parent.closest('.sr-only, [aria-hidden="true"]')) continue;
        const style = getComputedStyle(parent);
        if (style.visibility !== 'visible' || Number(style.opacity) < 0.05) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
            // Only what is actually on screen can be covered.
            if (rect.width < 2 || rect.height < 2) continue;
            if (rect.bottom <= 0 || rect.top >= innerHeight) continue;
            targets.push({
                label: node.textContent.trim().slice(0, 42),
                hero: Boolean(heroName && heroName.contains(node)),
                rect: { left: rect.left, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
            });
        }
    }
    const coverage = layer.probeCoverage(targets.map((entry) => entry.rect));
    return targets.map((entry, index) => ({ ...entry, coverage: coverage[index] }));
});

const scan = async (label) => {
    const results = await sample();
    if (!results) return assert(false, `${label}: world layer exposes no coverage probe`);
    if (!results.length) return assert(false, `${label}: found no on-screen text to measure`);
    const body = results.filter((entry) => !entry.hero);
    const worst = body.reduce((a, b) => (b.coverage > a.coverage ? b : a), { coverage: 0, label: 'none' });
    assert(worst.coverage <= CLEAR,
        `${label}: no body text is covered by geometry (worst ${(worst.coverage * 100).toFixed(1)}% on "${worst.label}", ${body.length} runs)`);
    return results;
};

try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    assert((await page.title()).includes('Ghanshyam'), `correct portfolio served at ${BASE}`);
    await page.waitForFunction(() => ['ready', 'static', 'fallback'].includes(document.querySelector('[data-world-layer]')?.dataset.worldStatus), undefined, { timeout: 20000 });
    const status = await page.locator('[data-world-layer]').getAttribute('data-world-status');
    assert(status === (MODE === 'reduced' ? 'static' : 'ready'), `world status is "${MODE === 'reduced' ? 'static' : 'ready'}" (got "${status}")`);
    await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]'), undefined, { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(1200);

    const hero = await scan('hero');
    if (hero) {
        const name = hero.filter((entry) => entry.hero);
        const covered = name.reduce((total, entry) => total + entry.coverage, 0) / Math.max(1, name.length);
        assert(name.length > 0, `hero name is real measurable DOM text (${name.length} runs)`);
        assert(covered >= NAME_MIN && covered <= NAME_MAX,
            `hero name is partly but not badly occluded (${(covered * 100).toFixed(1)}%, allowed ${NAME_MIN * 100}-${NAME_MAX * 100}%)`);
    }

    // Walk the whole page: every station added later lands in one of these.
    for (const id of ['impact', 'about', 'process', 'skills', 'experience', 'work', 'credentials', 'contact']) {
        await page.locator(`#${id}`).evaluate((section) => {
            window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' });
        });
        await page.waitForTimeout(700);
        await scan(id);
    }

    // Mid-scroll positions catch geometry that only overlaps text in transit
    // between two sections.
    for (const fraction of [0.15, 0.45, 0.75]) {
        await page.evaluate((value) => {
            window.scrollTo({ top: document.body.scrollHeight * value, behavior: 'instant' });
        }, fraction);
        await page.waitForTimeout(700);
        await scan(`scroll ${fraction}`);
    }

    const passthrough = await page.evaluate(() => {
        const layer = document.querySelector('[data-world-layer]');
        const style = getComputedStyle(layer);
        const canvas = layer.querySelector('canvas');
        return {
            events: style.pointerEvents,
            fixed: style.position === 'fixed',
            above: Number(style.zIndex) >= 9998,
            canvasEvents: canvas ? getComputedStyle(canvas).pointerEvents : 'none',
            hidden: layer.getAttribute('aria-hidden') === 'true',
        };
    });
    assert(passthrough.events === 'none' && passthrough.canvasEvents === 'none',
        `layer and canvas both ignore pointer events (${passthrough.events}/${passthrough.canvasEvents})`);
    assert(passthrough.fixed && passthrough.above, 'layer is viewport-fixed and above the document');
    assert(passthrough.hidden, 'layer is hidden from assistive technology');

    // Clicks and selection must reach the document underneath.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    const cta = page.locator('#home a[href="#work"]').first();
    await cta.click();
    await page.waitForTimeout(1200);
    const moved = await page.evaluate(() => window.scrollY > 200);
    assert(moved, 'hero CTA under the canvas is still clickable');

    assert(errors.length === 0, `no browser runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.message}`);
} finally {
    await browser.close();
}
console.log(`\nOcclusion ${WIDTH}px ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
