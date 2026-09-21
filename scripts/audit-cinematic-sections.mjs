import { chromium } from 'playwright';
import { profile } from '../src/data/profile.js';
import { certifications } from '../src/data/credentials.js';

const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
const HEIGHT = Number(process.argv[5] ?? (WIDTH < 768 ? 844 : 900));
const ONLY = process.argv[6];
const TITLES = {
    about: 'What I actually do', process: 'Four steps, every time', skills: 'The stack, layer by layer',
    experience: "Where I've done it", work: "Pipelines I've built",
    credentials: certifications.length ? 'Certifications & education' : 'Education', contact: 'Let’s talk',
};
if (!Number.isInteger(WIDTH) || WIDTH < 320 || !Number.isInteger(HEIGHT) || HEIGHT < 400
    || !['normal', 'reduced', 'font-blocked'].includes(MODE) || (ONLY && !(ONLY in TITLES))) {
    throw new Error('Usage: node scripts/audit-cinematic-sections.mjs BASE WIDTH normal|reduced|font-blocked [HEIGHT] [SECTION]');
}
const STATIC = MODE === 'reduced' || HEIGHT <= 600;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference' });
let failures = 0;
let blocked = 0;
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const assert = (ok, label) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${label}`);
};
const seek = async (id, progress) => {
    await page.locator(`#${id} [data-scene-track]`).evaluate((track, value) => {
        const r = track.getBoundingClientRect();
        const section = track.closest('[data-cinematic-section]');
        const top = parseFloat(getComputedStyle(section).getPropertyValue('--scene-pin-top'));
        window.scrollTo({ top: r.top + scrollY - top + r.height * value, behavior: 'instant' });
    }, progress);
    await page.waitForTimeout(850);
};
const sample = (id) => page.locator(`#${id}`).evaluate((section) => {
    const title = section.querySelector('[data-cinematic-heading]');
    const pin = section.querySelector('[data-scene-pin]');
    const content = section.querySelector('[data-scene-content]');
    const matrix = (element) => {
        const value = getComputedStyle(element).transform;
        const m = new DOMMatrixReadOnly(value === 'none' ? undefined : value);
        return { scale: m.m11, x: m.m41, y: m.m42 };
    };
    const lines = [...title.querySelectorAll('[data-scene-line]')].flatMap((line) => {
        const range = document.createRange();
        range.selectNodeContents(line);
        return [...range.getClientRects()].map((r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }));
    });
    return {
        mode: section.dataset.sceneMotion, title: matrix(title), content: matrix(content),
        contentTransform: getComputedStyle(content).transform,
        opacity: Number(getComputedStyle(content).opacity),
        rule: matrix(section.querySelector('[data-scene-rule]')).scale,
        pinTop: pin.getBoundingClientRect().top,
        pinPosition: getComputedStyle(pin).position,
        contentTop: content.getBoundingClientRect().top,
        visualText: [...title.querySelectorAll('[data-scene-line]')].map((line) => line.textContent).join(' '),
        lines, runway: section.querySelector('[data-scene-runway]').getBoundingClientRect().height,
        pageHeight: document.documentElement.scrollHeight,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        locked: getComputedStyle(document.documentElement).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden',
        viewportWidth: innerWidth, viewportHeight: innerHeight,
    };
});
const samePose = (a, b) => Math.abs(a.title.scale - b.title.scale) < .005 && Math.abs(a.title.x - b.title.x) < .5
    && Math.abs(a.title.y - b.title.y) < .5 && Math.abs(a.content.y - b.content.y) < .5 && Math.abs(a.opacity - b.opacity) < .005;
const inkFits = (state) => state.lines.length > 0 && state.lines.every((line) => line.width > 0 && line.height > 0
    && line.left >= -1 && line.right <= state.viewportWidth + 1 && line.top >= -1 && line.bottom <= state.viewportHeight + 1);

try {
    if (MODE === 'font-blocked') await page.route('**/*.woff*', (route) => { blocked += 1; return route.abort(); });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.locator('#home h1').waitFor();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]')
        && document.querySelectorAll('[data-hero-name-target]').length === 2
        && [...document.querySelectorAll('[data-hero-name-target]')].every((element) => Number(getComputedStyle(element).opacity) > .99), undefined, { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    assert(await page.locator('[data-cinematic-section]').count() === 7 && await page.locator('h2[data-cinematic-heading]').count() === 7,
        'all seven sections use the shared cinematic system');
    assert(await page.locator('[data-editorial-word], [data-heading-mask], [data-heading-echo], [data-heading-letter]').count() === 0,
        'old word tricks, masks, ghost text and letter fans are absent');
    const paragraphs = await page.locator('#about [data-scene-content] > div > p').allTextContents();
    assert(JSON.stringify(paragraphs) === JSON.stringify(profile.about), 'approved About copy is unchanged');
    assert((await page.locator('#about [data-scene-content] aside').innerText()).includes(profile.currently.text), 'Currently copy remains present');
    for (const [id, title] of Object.entries(TITLES).filter(([id]) => !ONLY || ONLY === id)) {
        assert(await page.getByRole('heading', { name: title, exact: true, level: 2 }).count() === 1, `${id}: one exact accessible heading`);
        assert(await page.locator(`#${id}`).getAttribute('aria-labelledby') === `${id}-title`, `${id}: section-to-heading linkage preserved`);
        await seek(id, 0);
        const start = await sample(id);
        assert(start.mode === (STATIC ? 'static' : 'cinematic'), `${id}: correct ${STATIC ? 'static' : 'cinematic'} mode`);
        assert(start.visualText === title, `${id}: visual line layout retains exact heading copy`);
        if (STATIC) {
            assert(start.pinPosition === 'static' && start.runway === 0, `${id}: static layout removes pinning and extra runway`);
            assert(Math.abs(start.title.scale - 1) < .001 && Math.abs(start.title.x) < .1 && Math.abs(start.title.y) < .1
                && Math.abs(start.content.y) < .1 && start.opacity === 1 && start.contentTransform === 'none', `${id}: static composition is undistorted and fully visible`);
            assert(inkFits(start) && start.overflow <= 1, `${id}: static heading ink fits viewport`);
            await page.evaluate(() => window.scrollBy({ top: 150, behavior: 'instant' }));
            await page.waitForTimeout(850);
            assert(samePose(start, await sample(id)), `${id}: static pose does not animate on scroll`);
        } else {
            assert(start.pinPosition === 'sticky', `${id}: native CSS sticky, not a scroll lock`);
            assert(start.runway >= 100 && start.runway <= 300, `${id}: brief scroll runway (${Math.round(start.runway)}px)`);
            const phases = [start];
            for (const p of [.25, .5, .75, 1]) { await seek(id, p); phases.push(await sample(id)); }
            phases.forEach((state, index) => {
                assert(inkFits(state), `${id} phase ${index}/4: complete heading ink stays inside viewport`);
                assert(Math.max(...state.lines.map((line) => line.bottom)) + 8 <= state.contentTop, `${id} phase ${index}/4: heading stays clear of content`);
                assert(state.overflow <= 1 && !state.locked, `${id} phase ${index}/4: no overflow or scroll lock`);
                assert(Math.abs(state.pageHeight - start.pageHeight) <= 1, `${id} phase ${index}/4: no document-height reflow`);
            });
            const middle = phases[2];
            const end = phases[4];
            assert(Math.abs(start.pinTop - middle.pinTop) < 2, `${id}: heading holds through the middle of the scene`);
            assert(start.title.scale - end.title.scale > (WIDTH >= 768 ? .4 : .08), `${id}: noticeable large-to-settled scale transition`);
            assert(start.title.scale > middle.title.scale && middle.title.scale > end.title.scale, `${id}: heading is continuously scroll-linked`);
            assert(start.content.y > middle.content.y && middle.content.y > end.content.y && end.opacity >= .99, `${id}: content enters with the heading`);
            assert(Math.abs(end.title.scale - 1) < .001 && Math.abs(end.title.y) < .1 && Math.abs(end.title.x) < .1
                && end.contentTransform === 'none', `${id}: reading state removes all residual content transforms`);
            assert(end.rule > start.rule + .7, `${id}: divider shares the scene timeline`);
            await page.waitForTimeout(350);
            assert(samePose(end, await sample(id)), `${id}: scene is still after scrolling stops`);
            await page.evaluate(() => window.scrollBy({ top: 150, behavior: 'instant' }));
            await page.waitForTimeout(850);
            const after = await sample(id);
            assert(after.pinTop < end.pinTop - 100 && samePose(after, end), `${id}: pin releases naturally and preserves the readable pose`);
            await seek(id, 0);
            assert(samePose(start, await sample(id)), `${id}: reverse scrolling restores the opening composition`);
        }
    }
    if (!ONLY || ONLY === 'work') {
        await seek('work', 1);
        const index = page.getByRole('navigation', { name: 'Projects', exact: true });
        await index.evaluate((element) => {
            const top = parseFloat(getComputedStyle(element).top);
            window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - top + 120, behavior: 'instant' });
        });
        await page.waitForTimeout(850);
        const before = await index.evaluate((element) => ({ top: element.getBoundingClientRect().top, expected: parseFloat(getComputedStyle(element).top), position: getComputedStyle(element).position }));
        await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'instant' }));
        await page.waitForTimeout(850);
        const after = await index.boundingBox();
        assert(before.position === 'sticky' && Math.abs(before.top - before.expected) < 2 && after && Math.abs(after.y - before.top) < 2,
            'project jump navigation stays genuinely sticky after its section entrance');
    }
    if (!STATIC && !ONLY) {
        await page.setViewportSize({ width: WIDTH >= 768 ? 390 : 768, height: HEIGHT });
        await page.waitForTimeout(850);
        for (const id of ['skills', 'credentials', 'contact']) {
            await seek(id, 0);
            const resized = await sample(id);
            assert(inkFits(resized) && resized.overflow <= 1, `${id}: opening composition re-fits after a breakpoint resize`);
        }
        await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    }
    await page.goto('about:blank');
    const deepId = ONLY ?? 'skills';
    await page.goto(new URL(`#${deepId}`, BASE).href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1400);
    const linked = await page.locator(`#${deepId}`).boundingBox();
    assert(linked && Math.abs(linked.y) < 200 && await page.locator('[data-intro-overlay]').count() === 0, 'direct links reach the cinematic section without an intro gate');
    if (MODE === 'font-blocked') assert(blocked > 0, 'font fallback mode genuinely intercepted fonts');
    assert(errors.length === 0, `no runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.stack}`);
} finally {
    await browser.close();
}
console.log(`\nCinematic sections ${WIDTH}x${HEIGHT} ${MODE}${ONLY ? ` (${ONLY})` : ''}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
