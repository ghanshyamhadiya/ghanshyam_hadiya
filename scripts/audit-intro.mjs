// Checks the FIRST-LOAD sequence: does the hero actually animate after the
// preloader curtain lifts, or has it already finished behind it?
//
// The failure this catches is invisible on a reload, because the intro is
// session-scoped and skipped the second time.
import { chromium } from 'playwright';

// The intro now runs on EVERY load, with two lengths: full on the first load of
// a session, short on every refresh after. Pass `short` to exercise the second
// path — the script reloads once first so the stored flag is set.
const BASE = process.argv[2] ?? 'http://localhost:5173';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] === 'short' ? 'short' : 'full';

const browser = await chromium.launch();
// Fresh context => empty sessionStorage => the full intro plays.
const page = await browser.newPage({
    viewport: { width: WIDTH, height: WIDTH < 768 ? 800 : 900 },
});

const readState = () =>
    page.evaluate(() => {
        const preloader = document.querySelector('[data-intro-curtain]');
        const h1 = document.querySelector('#home [data-hero-line]');
        const intro = document.querySelector('#home [data-hero-intro]');

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

        // How much of the screen the curtain still covers. Element presence is
        // not the right signal: AnimatePresence keeps the overlay mounted for a
        // beat after it has travelled off-screen, so measuring the unmount
        // would report the curtain as up long after it is visually gone.
        let coverage = 0;
        if (preloader) {
            const vh = window.innerHeight;
            const r = preloader.getBoundingClientRect();
            coverage = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh;
        }

        return {
            preloaderPresent: Boolean(preloader),
            coverage: Number(coverage.toFixed(2)),
            headlineY: ty(h1),
            introOpacity: intro ? Number(getComputedStyle(intro).opacity).toFixed(2) : null,
        };
    });

await page.goto(BASE, { waitUntil: 'domcontentloaded' });

if (MODE === 'short') {
    // Let the first intro finish so the flag is stored, then reload. This also
    // proves the intro is no longer skipped on refresh — the whole point of the
    // change. Previously a reload showed nothing at all.
    await page.waitForTimeout(3200);
    await page.reload({ waitUntil: 'domcontentloaded' });
}

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

// 4. The intro must actually appear — on a reload too, which it did not before.
assert(
    timeline.some((s) => s.preloaderPresent && s.coverage > 0.9),
    `intro curtain appears on this load (${MODE} mode)`
);

// 5. Over quickly. The short mode gets a tighter budget because it is what a
//    returning visitor sees on every refresh.
const budget = MODE === 'short' ? 1900 : 2600;
const done = timeline.find((s) => !s.preloaderPresent);
assert(
    Boolean(done) && done.t < budget,
    `intro completes under ${budget}ms in ${MODE} mode (${done?.t ?? '-'}ms)`
);

await browser.close();
process.exit(failures ? 1 : 0);
