import { chromium } from 'playwright';

// Audits the interactive hero data core: that it actually loads and renders,
// that every control changes real scene state, that it stops when it is not
// visible, and that both the reduced-motion and no-WebGL paths still read as a
// finished architecture drawing rather than an empty box.
const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'normal';
if (!['normal', 'reduced', 'fallback'].includes(MODE) || !Number.isInteger(WIDTH) || WIDTH < 320) {
    throw new Error('Usage: node scripts/audit-model.mjs BASE WIDTH normal|reduced|fallback');
}

let failures = 0;
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};
const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 768 ? 800 : 900 },
    reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
if (MODE === 'fallback') await page.route('**/*dataCoreScene*', (route) => route.abort());

const figure = page.locator('[data-hero-model]');
const stage = page.locator('[data-model-canvas]');
const status = () => figure.getAttribute('data-model-status');
const scene = () => stage.evaluate((host) => ({
    yaw: Number(host.dataset.modelYaw),
    gap: Number(host.dataset.modelGap),
    expanded: host.dataset.modelExpanded === 'true',
    frames: Number(host.dataset.renderCount),
}));
// Frames drawn over a fixed window: the only honest way to tell a paused
// scene from one that is merely rendering an unchanged image.
const drawn = async (ms = 500) => {
    const before = await scene();
    await page.waitForTimeout(ms);
    const after = await scene();
    return { frames: after.frames - before.frames, yaw: after.yaw - before.yaw, gap: after.gap, expanded: after.expanded };
};
const parkAtHero = async () => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(1, 1);
    await page.waitForTimeout(400);
};

try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    assert((await page.title()).includes('Ghanshyam'), `correct portfolio served at ${BASE}`);
    await page.waitForFunction(() => !document.querySelector('[data-intro-curtain]'), undefined, { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await parkAtHero();

    assert(await figure.count() === 1, 'hero exposes exactly one data core figure');
    if (MODE === 'normal') {
        const ready = await page.waitForFunction(() => document.querySelector('[data-hero-model]')?.dataset.modelStatus === 'ready', undefined, { timeout: 15000 })
            .then(() => true).catch(() => false);
        assert(ready, `model reaches ready state within 15s (status "${await status()}")`);
        if (!ready) throw new Error('Cannot audit live scene behaviour without a ready model');
    }

    const measure = () => figure.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        // Ink bounds, not block bounds: an h1 box spans its whole column, so
        // comparing against it would flag chips sitting in empty margin.
        const ink = (root) => {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const boxes = [];
            let node;
            while ((node = walker.nextNode())) {
                if (!node.textContent.trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                boxes.push(...[...range.getClientRects()].filter((box) => box.width > 0 && box.height > 0));
            }
            return boxes;
        };
        const text = [...element.querySelectorAll('span, button, figcaption')]
            .filter((node) => !node.closest('[data-model-stage]'))
            .flatMap((node) => ink(node).map((box) => ({ label: node.textContent.trim().slice(0, 24), box })));
        const chips = [...document.querySelectorAll('[data-floating-chip]')]
            .map((node) => ({ label: node.dataset.floatingChip, box: node.getBoundingClientRect().toJSON() }));
        const hits = (target) => chips.filter((chip) =>
            chip.box.left < target.right - 2 && chip.box.right > target.left + 2 &&
            chip.box.top < target.bottom - 2 && chip.box.bottom > target.top + 2);
        const heading = document.querySelector('#home h1');
        const stage = element.querySelector('[data-model-stage]').getBoundingClientRect();
        return {
            covered: text.flatMap((node) => hits(node.box).map((chip) => `${chip.label} over "${node.label}"`)),
            nameCovered: heading ? [...new Set(ink(heading).flatMap((box) => hits(box).map((chip) => chip.label)))] : [],
            offscreen: chips.filter((chip) => chip.box.left < 0 || chip.box.right > innerWidth).map((chip) => chip.label),
            controls: [...element.querySelectorAll('button')].map((node) => ({
                height: node.getBoundingClientRect().height,
                label: node.getAttribute('aria-label') || node.textContent.trim(),
            })),
            canvases: element.querySelectorAll('canvas').length,
            canvasHidden: element.querySelector('canvas')?.getAttribute('aria-hidden') === 'true',
            posterVisible: getComputedStyle(element.querySelector('[data-model-poster]')).visibility === 'visible',
            named: !!element.getAttribute('aria-labelledby') &&
                !!document.getElementById(element.getAttribute('aria-labelledby'))?.textContent.trim(),
            square: Math.abs(stage.width - stage.height) < 1 && stage.width > 200,
            withinCard: stage.left >= rect.left - 1 && stage.right <= rect.right + 1,
            overflow: document.documentElement.scrollWidth - innerWidth,
        };
    });
    // Chips carry a pointer-parallax spring plus a float loop, so a single
    // sample only proves one pose. Check both parallax extremes.
    for (const [corner, x, y] of [['top-left', 1, 1], ['bottom-right', WIDTH - 2, (WIDTH < 768 ? 800 : 900) - 2]]) {
        await page.mouse.move(x, y);
        await page.waitForTimeout(700);
        const pose = await measure();
        assert(pose.covered.length === 0, `${corner} parallax: chips never cover model text (${pose.covered.join(', ') || 'clear'})`);
        assert(pose.nameCovered.length === 0, `${corner} parallax: chips never cover the hero name (${pose.nameCovered.join(', ') || 'clear'})`);
        assert(pose.offscreen.length === 0, `${corner} parallax: chips stay inside the viewport (${pose.offscreen.join(', ') || 'clear'})`);
    }
    await parkAtHero();
    const layout = await measure();
    assert(layout.overflow <= 1, `model adds no horizontal overflow (${layout.overflow}px)`);
    assert(layout.named, 'figure has an accessible name from its caption');
    assert(layout.controls.length === 4 && layout.controls.every((c) => c.height >= 40 && c.label),
        `all 4 controls are labelled and at least 40px tall (${JSON.stringify(layout.controls)})`);
    assert(layout.square && layout.withinCard, `model stage is square and inside the card (${layout.square}, ${layout.withinCard})`);

    if (MODE === 'normal') {
        assert(layout.canvases === 1 && layout.canvasHidden, 'exactly one canvas, hidden from assistive tech');
        assert(!layout.posterVisible, 'static poster is hidden once the live scene is ready');

        const idle = await drawn();
        assert(idle.frames > 20, `scene renders continuously while visible (${idle.frames} frames / 500ms)`);
        assert(idle.yaw > 0.02 && idle.yaw < 0.12, `idle drift is gentle, not spinning (${idle.yaw.toFixed(3)} rad / 500ms)`);

        const beforeRotate = (await scene()).yaw;
        await figure.locator('[data-model-rotate]').click();
        await page.waitForTimeout(700);
        const rotated = (await scene()).yaw - beforeRotate;
        assert(rotated > 0.7 && rotated < 1.1, `Rotate turns the model about 45 degrees (${rotated.toFixed(3)} rad)`);

        const layers = figure.locator('[data-model-layers]');
        const closedGap = (await scene()).gap;
        await layers.click();
        await page.waitForTimeout(800);
        const openState = await scene();
        assert(openState.gap - closedGap > 0.6, `Layers actually separates the plates (${closedGap.toFixed(2)} to ${openState.gap.toFixed(2)})`);
        assert(await layers.getAttribute('aria-pressed') === 'true' && /assemble/i.test(await layers.getAttribute('aria-label')),
            'Layers reports its pressed state and offers to reassemble');
        await layers.click();
        await page.waitForTimeout(800);
        assert(Math.abs((await scene()).gap - closedGap) < 0.05, 'Layers collapses the plates back');

        const pause = figure.locator('[data-model-pause]');
        await pause.click();
        await page.waitForTimeout(200);
        const paused = await drawn();
        assert(paused.frames === 0 && Math.abs(paused.yaw) < 0.001, `Pause actually stops rendering (${paused.frames} frames)`);
        assert(await pause.getAttribute('aria-pressed') === 'true' && /play/i.test(await pause.innerText()), 'Pause reports pressed and offers Play');
        await pause.click();
        await page.waitForTimeout(200);
        assert((await drawn()).frames > 20, 'Play resumes rendering');

        await figure.locator('[data-model-layers]').click();
        await figure.locator('[data-model-rotate]').click();
        await page.waitForTimeout(300);
        await figure.locator('[data-model-reset]').click();
        await page.waitForTimeout(900);
        const reset = await scene();
        assert(Math.abs(reset.gap - closedGap) < 0.05 && !reset.expanded, 'Reset reassembles the layers');
        assert(await figure.locator('[data-model-layers]').getAttribute('aria-pressed') === 'false', 'Reset syncs the Layers button state');
        assert(Math.abs(reset.yaw) < 0.2, `Reset returns the model to its front view (${reset.yaw.toFixed(3)} rad)`);

        const box = await stage.boundingBox();
        const beforeDrag = (await scene()).yaw;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2, { steps: 8 });
        await page.mouse.up();
        await page.waitForTimeout(500);
        // 90px * 0.008 rad/px = 0.72, plus up to ~0.1 of idle drift once the
        // pointer is released.
        const dragged = (await scene()).yaw - beforeDrag;
        assert(dragged > 0.65 && dragged < 0.9, `dragging rotates the model under the pointer (${dragged.toFixed(3)} rad)`);
        await parkAtHero();

        await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(600);
        assert((await drawn()).frames === 0, 'scene stops rendering once scrolled offscreen');
        await parkAtHero();
        assert((await drawn()).frames > 20, 'scene resumes rendering when scrolled back');

        const heights = [];
        for (const action of ['[data-model-layers]', '[data-model-pause]', '[data-model-reset]']) {
            await figure.locator(action).click();
            await page.waitForTimeout(300);
            heights.push(await figure.evaluate((element) => element.getBoundingClientRect().height));
        }
        assert(heights.every((height) => Math.abs(height - heights[0]) < 1), `controls never resize the card (${heights.join(', ')})`);
    } else {
        const label = MODE === 'reduced' ? 'reduced motion' : 'WebGL failure';
        const expected = MODE === 'reduced' ? 'static' : 'fallback';
        if (MODE === 'fallback') {
            await page.waitForFunction(() => document.querySelector('[data-hero-model]')?.dataset.modelStatus === 'fallback', undefined, { timeout: 15000 })
                .catch(() => {});
        }
        assert(await status() === expected, `${label}: status is "${expected}" (got "${await status()}")`);
        assert(layout.canvases === 0, `${label}: no WebGL canvas is created`);
        assert(layout.posterVisible, `${label}: the static architecture poster is shown instead`);
        const caption = await figure.locator('figcaption').innerText();
        assert(/static architecture view/i.test(caption), `${label}: caption explains the static view (${caption.split('\n')[0]})`);
        assert(/not live telemetry/i.test(caption), `${label}: caption still disclaims live telemetry`);
        const layers = figure.locator('[data-model-layers]');
        const closed = await figure.locator('[data-model-poster] g').first().evaluate((g) => g.getBoundingClientRect().top);
        await layers.click();
        await page.waitForTimeout(600);
        const open = await figure.locator('[data-model-poster] g').first().evaluate((g) => g.getBoundingClientRect().top);
        assert(Math.abs(open - closed) > 3, `${label}: Layers still separates the static poster (${(open - closed).toFixed(1)}px)`);
        assert(await figure.locator('[data-model-rotate]').isDisabled() && await figure.locator('[data-model-pause]').isDisabled(),
            `${label}: live-only controls are disabled rather than silently inert`);
    }

    assert(errors.length === 0, `no browser runtime errors (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.message}`);
} finally {
    await browser.close();
}
console.log(`\nData core ${WIDTH}px ${MODE}: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
