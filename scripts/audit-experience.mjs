import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
if (!Number.isInteger(WIDTH) || WIDTH < 320 || !['normal', 'reduced', 'fallback'].includes(MODE)) {
    throw new Error('Usage: node scripts/audit-experience.mjs BASE WIDTH normal|reduced|fallback');
}
const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 768 ? 844 : 900 },
    reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference',
});
const errors = [];
const models = [];
let blocked = 0;
let failures = 0;
const assert = (condition, label) => {
    if (!condition) failures += 1;
    console.log(`${condition ? 'ok   ' : 'FAIL '} ${label}`);
};
page.on('pageerror', (error) => errors.push(error.message));
page.on('request', (request) => {
    if (/\.(glb|gltf)(\?|$)/i.test(request.url())) models.push(request.url());
});
const pose = (id) => page.evaluate((key) => {
    const layer = document.querySelector('[data-world-layer]');
    return JSON.parse(layer?.dataset.scenePoses ?? '{}')[key];
}, id);
const count = () => page.locator('[data-world-canvas]').getAttribute('data-render-count').then(Number);
const locate = async (id, fraction) => {
    await page.locator(`[data-station="${id}"]`).evaluate((element, value) => {
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - innerHeight * value, behavior: 'instant' });
    }, fraction);
    await page.waitForTimeout(450);
};

try {
    if (MODE === 'fallback') {
        await page.route('**/*dataWorld*', (route) => {
            blocked += 1;
            return route.abort();
        });
    }
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]'), undefined, { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    const expected = MODE === 'normal' ? 'ready' : MODE === 'reduced' ? 'static' : 'fallback';
    await page.waitForFunction((status) => document.querySelector('[data-world-layer]')?.dataset.worldStatus === status, expected, { timeout: 20000 });
    assert((await page.title()).includes('Ghanshyam'), 'correct portfolio served');
    assert(await page.locator('[data-hero-figure-slot], [data-figure-grab], #home img').count() === 0, 'no person, avatar slot or portrait in hero');
    assert(models.length === 0, `no avatar model requests (${models.length})`);
    assert(await page.locator('#home h1').count() === 1 && /Ghanshyam\s*Hadiya/.test(await page.locator('#home h1').innerText()), 'one readable semantic name');
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    assert(fits, 'page has no horizontal overflow');
    const cta = page.locator('#home a[href="#work"]').first();
    const ctaRect = await cta.boundingBox();
    assert(ctaRect && ctaRect.y >= 0 && ctaRect.y + ctaRect.height <= (WIDTH < 768 ? 844 : 900), 'primary CTA visible in initial viewport');
    if (MODE === 'fallback') {
        assert(blocked > 0, 'fallback route actually blocked the scene module');
        assert(await page.locator('[data-world-canvas]').count() === 0, 'fallback creates no WebGL canvas');
        assert(await page.locator('[data-scene-fallback]').count() === 4, 'all four scenes have static SVG fallbacks');
    } else {
        assert(await page.locator('[data-world-canvas]').count() === 1, 'exactly one shared WebGL canvas');
        for (const id of ['hero-data', 'process-data', 'skills-data', 'contact-data']) {
            assert(await page.locator(`[data-station="${id}"]`).count() === 1, `${id}: one reserved anchor`);
            await locate(id, .3);
            const visible = await pose(id);
            assert(visible?.visible === true, `${id}: live geometry becomes visible`);
            const coverage = await page.locator(`[data-station="${id}"]`).evaluate((element) => {
                const r = element.getBoundingClientRect();
                const top = Math.max(0, r.top);
                const bottom = Math.min(innerHeight, r.bottom);
                if (bottom <= top) return 0;
                return document.querySelector('[data-world-layer]').probeCoverage([{ left: r.left, top, bottom, width: r.width, height: bottom - top }])[0];
            });
            assert(coverage > .005, `${id}: real geometry paints the reserved box (${(coverage * 100).toFixed(1)}%)`);
        }
        await locate('process-data', .65);
        const start = await pose('process-data');
        await locate('process-data', .15);
        const end = await pose('process-data');
        if (MODE === 'normal') {
            assert(end?.progress > start?.progress + .1, 'scroll advances measured station progress');
            assert(Math.abs(end.rotation[1] - start.rotation[1]) > .15, 'scroll visibly rotates 3D geometry');
            await locate('process-data', .65);
            const reverse = await pose('process-data');
            assert(Math.abs(reverse.rotation[1] - start.rotation[1]) < .03, 'reverse scrolling restores the 3D pose');
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await page.waitForTimeout(450);
            const pause = page.getByRole('button', { name: 'Pause animation', exact: true });
            await pause.click();
            await page.waitForTimeout(250);
            const before = await count();
            await page.waitForTimeout(450);
            assert(await count() === before, 'pause stops continuous WebGL rendering');
            await page.getByRole('button', { name: 'Resume animation', exact: true }).click();
            await page.waitForTimeout(450);
            assert(await count() > before, 'resume restarts rendering');
        } else {
            assert(Math.abs(end.rotation[1] - start.rotation[1]) < .001, 'reduced motion keeps a fixed sculpture pose while scrolling');
            await page.waitForTimeout(250);
            const before = await count();
            await page.waitForTimeout(450);
            assert(await count() === before, 'reduced motion runs no continuous WebGL rendering');
        }
        await page.locator('#about').evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY, behavior: 'instant' }));
        await page.waitForTimeout(700);
        const states = await page.evaluate(() => JSON.parse(document.querySelector('[data-world-layer]').dataset.scenePoses));
        assert(Object.values(states).every((state) => !state.visible), 'no 3D station visible in the About reading zone');
        const offscreen = await count();
        await page.waitForTimeout(450);
        assert(await count() === offscreen, 'offscreen scenes do not keep rendering');
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(450);
    await cta.click();
    await page.waitForTimeout(1600);
    const workPosition = await page.locator('#work').boundingBox();
    assert(workPosition && Math.abs(workPosition.y) < 200, 'View work navigates to the project section');
    if (WIDTH < 1024) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(700);
        await page.getByRole('button', { name: 'Open menu', exact: true }).click();
        assert(await page.getByRole('dialog', { name: 'Site navigation' }).isVisible(), 'mobile navigation opens');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(700);
        assert(await page.getByRole('dialog', { name: 'Site navigation' }).count() === 0, 'Escape closes mobile navigation');
    }
    assert(models.length === 0, 'no avatar requests after exploring the page');
    assert(errors.length === 0, `no browser runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.stack}`);
} finally {
    await browser.close();
}
console.log(`\nExperience ${WIDTH}px ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
