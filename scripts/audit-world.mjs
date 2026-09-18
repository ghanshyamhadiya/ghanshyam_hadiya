import { chromium } from 'playwright';

// The WebGL layer's engineering contract, as opposed to the figure's
// behavioural one in audit-figure.mjs.
//
// Four things here are load-bearing for a full-page render loop and none of
// them are visible by looking at the site:
//
//   1. Exactly one WebGL context, ever. Browsers cap contexts at roughly 8-16
//      and silently kill the OLDEST when the cap is hit, so a leak does not
//      fail here — it kills the hero once enough sections own 3D in Phase 2.
//   2. Real disposal. A world that is replaced must hand its context back.
//   3. The degradation ladder must actually fire under load and must bottom
//      out at a still frame, not stutter forever.
//   4. A lost context must leave a finished, readable page.
//
// Frame COST, not frame RATE. Headless Chromium without a GPU only delivers
// around 19 rAF callbacks a second, so any assertion phrased as "is it 60fps"
// measures the test runner rather than the site. The site publishes its own
// measured p95 render cost, which is the number the perf bar is written
// against and is independent of how often the browser chooses to ask for a
// frame.
const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
if (!Number.isInteger(WIDTH) || WIDTH < 320) {
    throw new Error('Usage: node scripts/audit-world.mjs BASE WIDTH');
}
// The budget the app degrades against, mirrored from src/three/quality.js.
// Deliberately looser than the 16.7ms of a 60Hz frame so an ordinary GC pause
// does not read as a failure.
const BUDGET = WIDTH < 768 ? 36 : 22;

let failures = 0;
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: WIDTH < 768 ? 844 : 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

// Count every WebGL context the page ever asks for, before any app code runs.
// Cumulative, so a context that is created and properly released still shows
// up here — which is exactly what makes the disposal check below meaningful.
await page.addInitScript(() => {
    // Distinct context objects, not getContext calls: asking a canvas for the
    // same context type twice returns the one it already has, and the audit
    // itself does exactly that to trigger context loss.
    const seen = new Set();
    window.__contexts = { created: 0, lost: 0 };

    // Count forced layouts on anchor boxes. getBoundingClientRect on an
    // anchored element is only legitimate on register and on resize; doing it
    // per scroll event is the jank source this design exists to avoid, and it
    // regresses silently the moment someone adds a scroll listener.
    window.__anchorRects = 0;
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function patchedRect() {
        if (this.matches?.('[data-station],[data-hero-figure-slot]')) window.__anchorRects += 1;
        return rect.call(this);
    };
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(type, ...rest) {
        const context = original.call(this, type, ...rest);
        if (context && /webgl/i.test(type) && !seen.has(context)) {
            seen.add(context);
            window.__contexts.created += 1;
            this.addEventListener('webglcontextlost', () => { window.__contexts.lost += 1; });
        }
        return context;
    };
});

const layer = page.locator('[data-world-layer]');
const state = () => layer.evaluate((el) => {
    const canvas = el.querySelector('canvas');
    return {
        status: el.dataset.worldStatus,
        canvases: el.querySelectorAll('canvas').length,
        quality: canvas?.dataset.qualityLevel,
        p95: Number(canvas?.dataset.frameP95 ?? NaN),
        frames: Number(canvas?.dataset.renderCount ?? 0),
        contexts: window.__contexts,
    };
});
const settle = async () => {
    await page.waitForFunction(
        () => ['ready', 'static', 'fallback'].includes(document.querySelector('[data-world-layer]')?.dataset.worldStatus),
        undefined,
        { timeout: 20000 },
    );
    await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]'), undefined, { timeout: 20000 });
};

try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await settle();
    assert((await state()).status === 'ready', `world comes up ready (got "${(await state()).status}")`);

    // 1. One context, one canvas.
    const initial = await state();
    assert(initial.contexts.created === 1, `exactly one WebGL context created (${initial.contexts.created})`);
    assert(initial.canvases === 1, `exactly one canvas in the layer (${initial.canvases})`);
    assert(await page.locator('canvas').count() === 1, `exactly one canvas on the whole page (${await page.locator('canvas').count()})`);

    // 2. Frame cost against the published budget. Let the ring buffer fill
    // first: quality.js needs a full 60-sample window before it reports.
    await page.waitForFunction(
        () => Number(document.querySelector('[data-world-canvas]')?.dataset.frameP95) > 0,
        undefined,
        { timeout: 20000 },
    ).catch(() => {});
    const loaded = await state();
    assert(Number.isFinite(loaded.p95), `render cost is published for measurement (${loaded.p95})`);
    assert(loaded.p95 <= BUDGET, `p95 render cost is within the ${BUDGET}ms budget (${loaded.p95}ms at quality "${loaded.quality}")`);

    // 3. Scrolling must not force layout on anchor boxes. Anchors are stored
    // in document space precisely so a scroll costs one window.scrollY read
    // rather than a getBoundingClientRect per anchor per event.
    // Registration itself legitimately measures, so a non-zero count here is
    // what proves the instrumentation is live. Without this check a patch that
    // silently failed to attach would make the assertion below pass on
    // nothing.
    const registered = await page.evaluate(() => window.__anchorRects);
    assert(registered > 0, `anchor measurement is instrumented (${registered} reads while registering)`);
    const thrash = await page.evaluate(async () => {
        window.__anchorRects = 0;
        for (let i = 0; i < 24; i += 1) {
            window.scrollBy(0, 40);
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { reads: window.__anchorRects, anchors: document.querySelectorAll('[data-station],[data-hero-figure-slot]').length };
    });
    assert(thrash.anchors > 0, `the page registers anchor boxes to measure (${thrash.anchors})`);
    assert(thrash.reads === 0,
        `scrolling forces no layout on anchor boxes (${thrash.reads} getBoundingClientRect calls over 24 scroll steps)`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);

    // 4. The degradation ladder. Heavy CPU throttling must walk the quality
    // level DOWN and stop at a rung, rather than sit at full quality dropping
    // frames. This is the whole reason the ladder exists, so it has to be
    // demonstrated rather than assumed.
    const before = (await state()).quality;
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 20 });
    // Each rung needs a full 60-frame window plus 60 frames of settling, and
    // headless only offers ~19 a second, so this genuinely takes a while.
    const degraded = await page.waitForFunction(
        (start) => {
            const level = document.querySelector('[data-world-canvas]')?.dataset.qualityLevel;
            return level && level !== start ? level : false;
        },
        before,
        { timeout: 45000 },
    ).then((handle) => handle.jsonValue()).catch(() => null);
    assert(degraded !== null, `quality degrades under 20x CPU throttling ("${before}" -> "${degraded}")`);

    const order = ['high', 'medium', 'low', 'static'];
    assert(degraded === null || order.indexOf(degraded) > order.indexOf(before),
        `degradation moves down the ladder, never up ("${before}" -> "${degraded}")`);

    // The invariant that actually matters, and the one the perf bar is written
    // against: under sustained load the ladder must keep walking down until it
    // is either inside its budget or fully static. Settling on an animating
    // rung that is STILL over budget is the failure mode the ladder exists to
    // prevent — that is a permanently stuttering page.
    //
    // Note it may legitimately stop at any rung: each step cuts resolution,
    // then lighting, then geometry, so getting back inside budget at "medium"
    // is a success, not a half-measure.
    // "Has it stopped moving" must be measured in FRAMES, not seconds:
    // quality.js only re-decides after a full 60-sample window plus 60 frames
    // of settling, and under 20x throttling those 120 frames take far longer
    // than any wall-clock guess. Polling on a timer reads a stale p95 from a
    // rung the ladder has already left.
    const settleLadder = async (quietFrames = 150, timeoutMs = 150000) => {
        const began = Date.now();
        let mark = await state();
        while (Date.now() - began < timeoutMs) {
            await page.waitForTimeout(500);
            const next = await state();
            // The bottom rung stops the loop, so frames stop advancing and no
            // further decision is possible. That is terminal by definition.
            if (next.quality === 'static') return next;
            if (next.quality !== mark.quality) mark = next;
            else if (next.frames - mark.frames > quietFrames) return next;
        }
        return state();
    };
    const settled = await settleLadder();
    assert(settled.p95 <= BUDGET || settled.quality === 'static',
        `the ladder settles inside budget or goes static, never stutters on (p95 ${settled.p95}ms, ${BUDGET}ms budget, rung "${settled.quality}")`);

    // The bottom rung must stop the loop entirely: a static composition reads
    // as deliberate where permanent stutter reads as broken.
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const pinned = await page.evaluate(() => {
        const canvas = document.querySelector('[data-world-canvas]');
        const start = Number(canvas?.dataset.renderCount ?? 0);
        return new Promise((resolve) => {
            let rafs = 0;
            const began = performance.now();
            const step = () => {
                rafs += 1;
                if (performance.now() - began < 700) requestAnimationFrame(step);
                else resolve({ drawn: Number(canvas?.dataset.renderCount ?? 0) - start, rafs, level: canvas?.dataset.qualityLevel });
            };
            requestAnimationFrame(step);
        });
    });
    if (pinned.level === 'static') {
        assert(pinned.drawn === 0, `the static rung runs no render loop (${pinned.drawn} draws over ${pinned.rafs} frames)`);
    } else {
        assert(pinned.drawn / pinned.rafs > 0.8,
            `an animating rung still draws every frame (${pinned.drawn}/${pinned.rafs} at "${pinned.level}")`);
    }

    // 4. Disposal. Flipping the reduced-motion preference tears the world down
    // and builds a new one through the real React cleanup path, so the context
    // accounting has to come out one-in-one-out.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(
        () => document.querySelector('[data-world-layer]')?.dataset.worldStatus === 'static',
        undefined,
        { timeout: 20000 },
    ).catch(() => {});
    const rebuilt = await state();
    assert(rebuilt.status === 'static', `switching to reduced motion rebuilds a static world (got "${rebuilt.status}")`);
    assert(rebuilt.canvases === 1, `the replaced canvas is removed, not orphaned (${rebuilt.canvases} in the layer)`);
    assert(await page.locator('canvas').count() === 1, `still one canvas on the page after a rebuild (${await page.locator('canvas').count()})`);
    assert(rebuilt.contexts.created === 2 && rebuilt.contexts.lost >= 1,
        `the old context was released on teardown (${rebuilt.contexts.created} created, ${rebuilt.contexts.lost} released)`);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(
        () => document.querySelector('[data-world-layer]')?.dataset.worldStatus === 'ready',
        undefined,
        { timeout: 20000 },
    ).catch(() => {});

    // 5. A lost context must not take the page with it.
    await page.evaluate(() => {
        const canvas = document.querySelector('[data-world-canvas]');
        canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    await page.waitForFunction(
        () => document.querySelector('[data-world-layer]')?.dataset.worldStatus === 'fallback',
        undefined,
        { timeout: 10000 },
    ).catch(() => {});
    const lost = await state();
    assert(lost.status === 'fallback', `a lost context degrades to the static DOM path (got "${lost.status}")`);
    const readable = await page.locator('#home h1').evaluate(
        (el) => el.getBoundingClientRect().height > 40 && getComputedStyle(el).visibility === 'visible',
    );
    assert(readable, 'hero name is still rendered and readable after context loss');
    assert(errors.length === 0, `no browser runtime errors throughout (${errors.join('; ') || 'none'})`);
} catch (error) {
    failures += 1;
    console.error(`FAIL ${error.message}`);
} finally {
    await browser.close();
}
console.log(`\nWorld ${WIDTH}px: ${failures ? `${failures} failure(s)` : 'PASS'}`);
process.exitCode = failures ? 1 : 0;
