import { chromium } from 'playwright';

// The hero figure's behaviour contract.
//
// Inherits the shape of the data-core audit it replaces: prove the thing
// actually renders, prove every interaction changes real scene state rather
// than only a CSS class, and prove both the reduced-motion and no-WebGL paths
// still leave a finished page.
const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
if (!['normal', 'reduced', 'fallback'].includes(MODE) || !Number.isInteger(WIDTH) || WIDTH < 320) {
    throw new Error('Usage: node scripts/audit-figure.mjs BASE WIDTH normal|reduced|fallback');
}

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
if (MODE === 'fallback') await page.route('**/*world*.js', (route) => route.abort());

const layer = page.locator('[data-world-layer]');
const state = () => layer.evaluate((el) => {
    const canvas = el.querySelector('canvas');
    const box = (el.dataset.figureBox ?? '').split(',').map(Number);
    return {
        status: el.dataset.worldStatus,
        frames: Number(canvas?.dataset.renderCount ?? 0),
        quality: canvas?.dataset.qualityLevel,
        assembly: Number(el.dataset.figureAssembly),
        yaw: Number(el.dataset.figureYaw),
        headYaw: Number(el.dataset.figureHeadYaw),
        waving: el.dataset.figureWaving === 'true',
        box: box.length === 4 ? { left: box[0], top: box[1], right: box[2], bottom: box[3] } : null,
    };
});
const drawn = async (ms = 500) => {
    const before = await state();
    await page.waitForTimeout(ms);
    const after = await state();
    return { frames: after.frames - before.frames, after, before };
};
const parkAtHero = async () => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(2, 2);
    await page.waitForTimeout(500);
};

try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    assert((await page.title()).includes('Ghanshyam'), `correct portfolio served at ${BASE}`);
    await page.waitForFunction(
        () => ['ready', 'static', 'fallback'].includes(document.querySelector('[data-world-layer]')?.dataset.worldStatus),
        undefined,
        { timeout: 20000 },
    );
    const expected = { normal: 'ready', reduced: 'static', fallback: 'fallback' }[MODE];
    assert((await state()).status === expected, `world status is "${expected}" (got "${(await state()).status}")`);
    await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]'), undefined, { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await parkAtHero();

    const slot = await page.locator('[data-hero-figure-slot]').evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    assert(await page.locator('[data-hero-figure-slot]').count() === 1, 'hero exposes exactly one figure slot');
    assert(slot.width > 100 && slot.height > 150, `figure slot is a real box (${Math.round(slot.width)}x${Math.round(slot.height)})`);

    if (MODE === 'fallback') {
        assert(await layer.locator('canvas').count() === 0, 'no canvas when the world chunk cannot load');
        const readable = await page.locator('#home h1').evaluate((el) => el.getBoundingClientRect().height > 40 && getComputedStyle(el).visibility === 'visible');
        assert(readable, 'hero name is still rendered and readable without the 3D layer');
        assert(errors.length === 0, `no browser runtime errors (${errors.join('; ') || 'none'})`);
    } else {
        assert(await layer.locator('canvas').count() === 1, 'exactly one canvas for the whole page');
        assert(await layer.locator('canvas').getAttribute('aria-hidden') === 'true', 'canvas is hidden from assistive tech');

        const parked = await state();
        assert(parked.box !== null, 'figure publishes its projected screen box');
        // Perspective makes the projected box a little larger than the slot;
        // what matters is that it is centred on the slot and the same order of
        // size, not that it matches to the pixel.
        const centreDrift = Math.abs((parked.box.left + parked.box.right) / 2 - (slot.left + slot.right) / 2);
        const heightRatio = (parked.box.bottom - parked.box.top) / slot.height;
        assert(centreDrift < 24, `figure is centred on its slot (${centreDrift.toFixed(1)}px drift)`);
        assert(heightRatio > 0.75 && heightRatio < 1.3, `figure is scaled to its slot (${heightRatio.toFixed(2)}x)`);
        assert(Math.abs(parked.assembly - 1) < 0.001, `figure is fully assembled after the intro (${parked.assembly})`);

        if (MODE === 'reduced') {
            const still = await drawn(700);
            assert(still.frames === 0, `reduced motion runs no render loop (${still.frames} frames / 700ms)`);
            assert(still.after.quality === 'static', `reduced motion pins the static quality rung (${still.after.quality})`);
            await page.mouse.move(WIDTH - 40, 300);
            await page.waitForTimeout(400);
            assert(Math.abs((await state()).headYaw) < 0.01, 'reduced motion does not track the cursor');
        } else {
            const idle = await drawn();
            assert(idle.frames > 20, `scene renders continuously while the hero is visible (${idle.frames} frames / 500ms)`);

            // Cursor tracking: the head turns toward the pointer and back.
            await page.mouse.move(WIDTH - 40, 300);
            await page.waitForTimeout(700);
            const right = (await state()).headYaw;
            await page.mouse.move(40, 300);
            await page.waitForTimeout(700);
            const left = (await state()).headYaw;
            assert(right > 0.15 && left < -0.15, `head turns toward the cursor on both sides (${left.toFixed(3)} to ${right.toFixed(3)})`);
            await parkAtHero();

            // Drag to spin: the grab area is DOM, because the canvas cannot
            // receive pointer events under pointer-events: none.
            const beforeDrag = (await state()).yaw;
            await page.mouse.move(slot.left + slot.width / 2, slot.top + slot.height / 2);
            await page.mouse.down();
            await page.mouse.move(slot.left + slot.width / 2 + 140, slot.top + slot.height / 2, { steps: 10 });
            await page.mouse.up();
            await page.waitForTimeout(600);
            const dragged = (await state()).yaw - beforeDrag;
            assert(dragged > 0.4, `dragging the figure spins it (${dragged.toFixed(3)} rad)`);

            // Click reaction: a brief squash, so the box height dips and recovers.
            await parkAtHero();
            const restHeight = (await state()).box.bottom - (await state()).box.top;
            await page.locator('[data-hero-figure-slot]').click({ position: { x: slot.width / 2, y: slot.height / 2 } });
            await page.waitForTimeout(140);
            const squashed = (await state()).box.bottom - (await state()).box.top;
            await page.waitForTimeout(900);
            const recovered = (await state()).box.bottom - (await state()).box.top;
            assert(squashed < restHeight - 1, `clicking squashes the figure (${restHeight.toFixed(0)} to ${squashed.toFixed(0)}px)`);
            assert(Math.abs(recovered - restHeight) < 6, `the squash springs back (${recovered.toFixed(0)}px vs ${restHeight.toFixed(0)}px)`);

            // Offscreen work is wasted work and drains battery.
            await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
            await page.waitForTimeout(700);
            const away = await drawn();
            assert(away.frames === 0, `render loop stops once the hero is scrolled away (${away.frames} frames)`);
            await parkAtHero();
            assert((await drawn()).frames > 20, 'render loop resumes when the hero returns');
        }
        assert(errors.length === 0, `no browser runtime errors (${errors.join('; ') || 'none'})`);
    }
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.message}`);
} finally {
    await browser.close();
}
console.log(`\nFigure ${WIDTH}px ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
