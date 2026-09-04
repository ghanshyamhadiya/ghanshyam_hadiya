// Checks the FIRST-LOAD sequence: does the hero actually animate after the
// preloader curtain lifts, or has it already finished behind it?
//
// The failure this catches is invisible on a reload, because the intro is
// session-scoped and skipped the second time.
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5174';
const WIDTH = Number(process.argv[3] ?? 1440);

const browser = await chromium.launch();
// Fresh context => empty sessionStorage => the intro really plays.
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 768 ? 800 : 900 },
});

const readState = () =>
    page.evaluate(() => {
        const preloader = document.querySelector('[aria-label="Loading"]');
        const h1 = document.querySelector('#home h1 span span');
        const intro = document.querySelector('#home p');

        const ty = (el) => {
            if (!el) return null;
            const t = getComputedStyle(el).transform;
            if (!t || t === 'none') return 0;
            const m = t.match(/matrix\(([^)]+)\)/);
            if (m) return Math.round(Number.parseFloat(m[1].split(',')[5]));
            const m3 = t.match(/matrix3d\(([^)]+)\)/);
            if (m3) return Math.round(Number.parseFloat(m3[1].split(',')[13]));
            return 0;
        };

        // How much of the screen the wipe panels still cover. Element presence
        // is not the right signal: AnimatePresence keeps the overlay mounted
        // for a beat after the panels have travelled off-screen, so measuring
        // the unmount would report the curtain as up long after it is visually
        // gone.
        const panels = preloader ? [...preloader.querySelectorAll(':scope > span')] : [];
        let coverage = 0;
        if (panels.length) {
            const vh = window.innerHeight;
            const covered = panels.map((p) => {
                const r = p.getBoundingClientRect();
                return Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh;
            });
            coverage = Math.max(...covered);
        }

        return {
            preloaderPresent: Boolean(preloader),
            coverage: Number(coverage.toFixed(2)),
            headlineY: ty(h1),
            introOpacity: intro ? Number(getComputedStyle(intro).opacity).toFixed(2) : null,
        };
    });

await page.goto(BASE, { waitUntil: 'domcontentloaded' });

const timeline = [];
const t0 = Date.now();
for (let i = 0; i < 44; i += 1) {
    timeline.push({ t: Date.now() - t0, ...(await readState()) });
    await page.waitForTimeout(80);
}

console.log('  t(ms)  mounted  coverage  headlineY  introOpacity');
for (const s of timeline) {
    console.log(
        `  ${String(s.t).padStart(5)}  ${s.preloaderPresent ? 'YES    ' : 'no     '}  ` +
            `${String(s.coverage ?? 0).padStart(6)}    ` +
            `${String(s.headlineY ?? '-').padStart(7)}      ${s.introOpacity ?? '-'}`
    );
}

let failures = 0;
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};

console.log('');

// 1. The hero must not finish before the screen starts being uncovered.
const uncoverStart = timeline.find((s) => s.coverage > 0 && s.coverage < 0.98);
const settledAt = timeline.find((s) => (s.headlineY ?? 0) === 0);
assert(
    Boolean(uncoverStart) && Boolean(settledAt) && settledAt.t >= uncoverStart.t,
    `hero settles (${settledAt?.t ?? '-'}ms) no earlier than the wipe begins (${
        uncoverStart?.t ?? '-'
    }ms)`
);

// 2. The hero must still be visibly moving while the screen is half uncovered,
//    which is what makes the two motions read as one.
const midWipe = timeline.filter((s) => s.coverage > 0.15 && s.coverage < 0.85);
assert(
    midWipe.some((s) => Math.abs(s.headlineY ?? 0) > 3),
    `hero is still animating mid-wipe (${midWipe.length} sample(s) taken)`
);

// 3. The strongest guarantee: some of the hero's motion must land after the
//    screen is fully uncovered, so it is unambiguously seen rather than merely
//    overlapping a screen that is still 90% covered.
const uncoveredAt = timeline.find((s) => s.coverage === 0);
assert(
    Boolean(uncoveredAt) &&
        timeline.some((s) => s.t >= uncoveredAt.t && Math.abs(s.headlineY ?? 0) > 3),
    `hero is still animating after the screen is fully clear (clear at ${
        uncoveredAt?.t ?? '-'
    }ms)`
);

// 4. The whole intro should be over quickly.
const done = timeline.find((s) => !s.preloaderPresent);
assert(Boolean(done) && done.t < 2600, `intro completes in under 2.6s (${done?.t ?? '-'}ms)`);

await browser.close();
process.exit(failures ? 1 : 0);
