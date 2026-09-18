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
// The trailing * matters: Vite appends ?t=<timestamp> to re-fetched modules
// after edits, and a glob ending in .js then never matches — the abort
// silently stops blocking and the mode proves nothing.
if (MODE === 'fallback') await page.route('**/*world*.js*', (route) => route.abort());

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
        squash: Number(el.dataset.figureSquash ?? 0),
        source: el.dataset.figureSource,
        box: box.length === 4 ? { left: box[0], top: box[1], right: box[2], bottom: box[3] } : null,
    };
});
// Counts our draws AND the browser's own requestAnimationFrame callbacks over
// the same window.
//
// Absolute frame counts are useless here: headless Chromium without a GPU only
// delivers around 19 rAF callbacks a second, so an "is it 60fps" assertion
// measures the test environment rather than the site. What is meaningful is
// whether we draw on essentially every frame the browser offers, and whether
// we correctly draw nothing when we should be idle.
const drawn = async (ms = 600) => page.evaluate((duration) => new Promise((resolve) => {
    const layer = document.querySelector('[data-world-layer]');
    const canvas = layer.querySelector('canvas');
    const start = Number(canvas?.dataset.renderCount ?? 0);
    const began = performance.now();
    let rafs = 0;
    const step = () => {
        rafs += 1;
        if (performance.now() - began < duration) requestAnimationFrame(step);
        else resolve({ frames: Number(canvas?.dataset.renderCount ?? 0) - start, rafs, quality: canvas?.dataset.qualityLevel });
    };
    requestAnimationFrame(step);
}), ms);

const parkAtHero = async () => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(2, 2);
    await page.waitForTimeout(500);
};
// Pointer at the horizontal centre means pointerX is 0, so the figure faces
// straight ahead, AND the greeting wave must have finished. Geometry has to be
// measured from a known pose: the cursor turns the body and a raised arm makes
// the projected box roughly twice as wide, so measuring during either reads as
// a huge phantom offset.
const parkNeutral = async () => {
    const height = WIDTH < 768 ? 844 : 900;
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(WIDTH / 2, height / 2);
    await page.waitForFunction(
        () => document.querySelector('[data-world-layer]')?.dataset.figureWaving === 'false',
        undefined,
        { timeout: 8000 },
    ).catch(() => {});
    // Let the arm spring settle after the wave flag clears.
    await page.waitForTimeout(900);
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

        await parkNeutral();
        const parked = await state();
        assert(parked.box !== null, 'figure publishes its projected screen box');
        // Perspective makes the projected box a little larger than the slot;
        // what matters is that it is centred on the slot and the same order of
        // size, not that it matches to the pixel.
        const centreDrift = Math.abs((parked.box.left + parked.box.right) / 2 - (slot.left + slot.right) / 2);
        const heightRatio = (parked.box.bottom - parked.box.top) / slot.height;
        const widthRatio = (parked.box.right - parked.box.left) / slot.width;
        assert(centreDrift < 24, `figure is centred on its slot (${centreDrift.toFixed(1)}px drift)`);
        assert(heightRatio > 0.75 && heightRatio < 1.3, `figure is scaled to its slot (${heightRatio.toFixed(2)}x)`);
        // Width catches the failure height cannot see: a whole body scaled to
        // fit the slot's HEIGHT satisfies every height check while reading as a
        // distant doll. That bug measured 0.44.
        //
        // The floor has to depend on which body is loaded, because a single
        // threshold between the doll's 0.44 and the procedural figure's 0.50
        // would have two hundredths of margin and fail on breathing phase
        // alone. The avatar is waist-cropped, so it genuinely fills the slot
        // (measured 0.98-1.09) and is what this assertion exists to protect.
        // The procedural figure has no crop to get wrong — it simply fills
        // whatever slot it is given — so for it this is only a sanity floor.
        const minWidth = parked.source === 'avatar' ? 0.8 : 0.35;
        assert(widthRatio > minWidth,
            `figure fills its slot's width (${widthRatio.toFixed(2)}x, ${parked.source} floor ${minWidth})`);
        assert(Math.abs(parked.assembly - 1) < 0.001, `figure is fully assembled after the intro (${parked.assembly})`);

        if (MODE === 'reduced') {
            const still = await drawn(700);
            assert(still.frames === 0, `reduced motion runs no render loop (${still.frames} draws over ${still.rafs} browser frames)`);
            assert(still.quality === 'static', `reduced motion pins the static quality rung (${still.quality})`);
            await page.mouse.move(WIDTH - 40, 300);
            await page.waitForTimeout(400);
            assert(Math.abs((await state()).headYaw) < 0.01, 'reduced motion does not track the cursor');
        } else {
            const idle = await drawn();
            assert(idle.frames / idle.rafs > 0.9,
                `draws on every frame the browser offers (${idle.frames}/${idle.rafs}, quality ${idle.quality})`);

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

            // Click reaction. Read the published squash value rather than
            // inferring it from the bounding box: the box also moves with
            // breathing and the cursor, so it cannot isolate one impulse.
            await parkNeutral();
            assert((await state()).squash === 0, 'figure is at rest before the click');
            await page.locator('[data-hero-figure-slot]').click({ position: { x: slot.width / 2, y: slot.height / 2 } });
            // The impulse is only half a second long and click dispatch itself
            // costs a chunk of that, so poll for the peak instead of sampling
            // once and hoping to land on it.
            let reacting = 0;
            for (let i = 0; i < 12; i += 1) {
                reacting = Math.max(reacting, (await state()).squash);
                await page.waitForTimeout(45);
            }
            await page.waitForTimeout(900);
            const recovered = (await state()).squash;
            assert(reacting > 0.3, `clicking the figure triggers a squash (peak ${reacting.toFixed(3)})`);
            assert(recovered === 0, `the squash settles back to rest (${recovered.toFixed(3)})`);

            // Offscreen work is wasted work and drains battery.
            await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
            await page.waitForTimeout(800);
            const away = await drawn();
            assert(away.frames === 0, `render loop stops once the hero is scrolled away (${away.frames} draws over ${away.rafs} frames)`);
            await parkAtHero();
            const back = await drawn();
            assert(back.frames / back.rafs > 0.9, `render loop resumes when the hero returns (${back.frames}/${back.rafs})`);
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
