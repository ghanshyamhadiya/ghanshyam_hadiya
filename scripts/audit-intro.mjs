// Checks the FIRST-LOAD sequence: does the hero actually animate after the
// preloader curtain lifts, or has it already finished behind it?
//
// The failure this catches is invisible on a reload, because the intro is
// session-scoped and skipped the second time.
import { chromium } from 'playwright';
import { profile } from '../src/data/profile.js';
import { INTRO_TIMING } from '../src/utils/motion.js';

// The intro now runs on EVERY load, with two lengths: full on the first load of
// a session, short on every refresh after. Pass `short` to exercise the second
// path — the script reloads once first so the stored flag is set.
const BASE = process.argv[2] ?? 'http://localhost:5175';
const WIDTH = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] === 'short' ? 'short' : 'full';
const timing = INTRO_TIMING[MODE];
if (Math.abs(INTRO_TIMING.short.hold * 1.4 - 1150) > 0.001 || Math.abs(INTRO_TIMING.short.handoff * 1.4 - 1.45) > 0.001 || INTRO_TIMING.full.rate !== 1 || INTRO_TIMING.short.rate !== 1.4) throw new Error('Repeat welcome must use 1.4x playback speed without accelerating the first visit');
const browser = await chromium.launch();
// Fresh context => empty sessionStorage => the full intro plays.
const page = await browser.newPage({ viewport: { width: WIDTH, height: WIDTH < 768 ? 800 : 900 } });
let failures = 0;
const assert = (ok, message) => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${message}`);
};
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.addInitScript(() => {
    window.introFrames = [];
    const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { x: r.x, y: r.y, width: r.width, height: r.height, opacity: Number(s.opacity), text: el.textContent.trim() };
    };
    const sample = () => {
        const overlay = document.querySelector('[data-intro-overlay]');
        const curtain = document.querySelector('[data-intro-curtain]');
        let coverage = 0;
        // How much of the screen the curtain still covers. Element presence is
        // not the right signal: the overlay also contains travelling names.
        // Measure the actual background clip, not the fixed overlay rectangle.
        if (curtain) {
            const parts = getComputedStyle(curtain).clipPath.replace(/^inset\(/, '').split('round')[0].replace(/\)/g, '').trim().split(/\s+/);
            const bottom = parts.length < 3 ? parts[0] : parts[2];
            const cut = parseFloat(bottom) || 0;
            coverage = Math.max(0, 1 - (bottom.includes('%') ? cut / 100 : cut / innerHeight));
        }
        window.introFrames.push({
            t: performance.now(), present: Boolean(overlay), phase: overlay?.dataset.introPhase,
            coverage, scroll: scrollY, viewport: innerWidth,
            starts: [...document.querySelectorAll('[data-intro-name-start]')].map(rect),
            targets: [...document.querySelectorAll('[data-hero-name-target]')].map(rect),
            ink: [...document.querySelectorAll('[data-intro-flight][data-flight-tone="ink"]')].map(rect),
            light: [...document.querySelectorAll('[data-intro-flight][data-flight-tone="light"]')].map(rect),
            mark: rect(document.querySelector('[data-intro-mark]')),
            markTarget: rect(document.querySelector('[data-nav-mark]')),
            markFlight: rect(document.querySelector('[data-intro-flight-mark]')),
        });
        if (!window.stopIntroCapture && window.introFrames.length < 1000) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
});

const distance = (a, b) => a && b ? Math.max(...['x', 'y', 'width', 'height'].map((key) => Math.abs(a[key] - b[key]))) : Infinity;

try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    if (MODE === 'short') {
        // Let the first intro finish so the flag is stored, then reload. This also
        // proves the intro is no longer skipped on refresh — the whole point of the
        // change. Previously a reload showed nothing at all.
        await page.waitForFunction(() => window.introFrames?.some((f) => f.present) && !document.querySelector('[data-intro-overlay]'), null, { timeout: 12000 });
        await page.reload({ waitUntil: 'domcontentloaded' });
    }
    await page.waitForFunction(() => window.introFrames?.some((f) => f.present) && !document.querySelector('[data-intro-overlay]'), null, { timeout: 12000 });
    await page.waitForTimeout(250);
    const frames = await page.evaluate(() => { window.stopIntroCapture = true; return window.introFrames; });
    const first = frames.find((f) => f.present);
    const after = frames.filter((f) => first && f.t > first.t && !f.present);
    const flights = frames.filter((f) => f.ink.length === profile.nameLines.length);
    const welcome = frames.filter((f) => f.phase === 'welcome' && f.starts.length === profile.nameLines.length && f.starts.every((name) => name.opacity > 0.99) && f.mark?.opacity > 0.99);
    assert(Boolean(first) && after.length > 0 && flights.length > 4, 'welcome, shared flight and completed hero are all observed');
    const duration = after[0]?.t - first?.t;
    const readable = welcome.length ? welcome.at(-1).t - welcome[0].t : 0;
    assert(readable >= (MODE === 'full' ? 750 : 200) / timing.rate, `welcome name is readable before moving (${Math.round(readable)}ms)`);

    // 1. The hero must not finish before the screen starts being uncovered.
    assert(flights.length > 0 && flights.every((f) => f.targets.every((name) => name.opacity < 0.01)), 'hero name placeholders stay hidden until their travelling counterparts land');
    const start = flights[0];
    assert(Boolean(start) && start.ink.every((name, i) => distance(name, start.starts[i]) < 5), 'travelling names start at the welcome text positions');
    assert(Boolean(start?.markFlight) && distance(start.markFlight, start.mark) < 5, 'travelling GH starts at the welcome badge');

    // 2. The hero must still be visibly moving while the screen is half uncovered,
    // which is what makes the two motions read as one.
    const middle = flights.filter((f) => f.coverage > 0.1 && f.coverage < 0.9);
    assert(middle.length > 2 && middle.some((f) => distance(f.ink[0], f.targets[0]) > 10), 'name flight remains visible while the hero background opens');
    assert(flights.every((f) => f.light.length === f.ink.length && f.ink.every((name, i) => distance(name, f.light[i]) < 0.5)), 'light/ink copies share identical geometry across the curtain edge');
    assert(flights.every((f) => f.ink.every((name) => name.x >= -1 && name.x + name.width <= f.viewport + 1)), 'travelling names are never cut at viewport sides');

    // 3. The strongest guarantee: some of the hero's motion must land after the
    // screen is fully uncovered, so it is unambiguously seen rather than merely
    // overlapping a screen that is still 90% covered.
    assert(flights.some((f) => f.coverage < 0.001 && distance(f.ink[0], f.targets[0]) > 0.5), 'shared name continues moving after the background has fully opened');
    const landing = flights.at(-1);
    assert(Boolean(landing) && landing.ink.every((name, i) => distance(name, landing.targets[i]) < 1), 'each name lands exactly on its actual hero target');
    assert(Boolean(landing) && distance(landing.markFlight, landing.markTarget) < 1, 'GH lands exactly in the navigation badge');
    assert(after.length > 0 && after.every((f) => f.targets.length === profile.nameLines.length && f.targets.every((name, i) => name.opacity === 1 && name.text === profile.nameLines[i] && distance(name, landing?.targets[i]) < 1)), 'hero name is visible and stable with no second entrance or landing jump');
    assert(after[0]?.markTarget?.opacity === 1, 'real navigation badge takes over without a gap');
    assert(frames.filter((f) => f.present).every((f) => Math.abs(f.scroll) < 1), 'page stays still while welcome targets are being connected');
    assert(await page.evaluate(() => document.documentElement.style.overflow !== 'hidden'), 'scroll lock is restored after hand-off');

    // 4. The intro must actually appear — on a reload too, which it did not before.
    assert(frames.some((f) => f.present && f.coverage > 0.99 && f.mark?.text === profile.nameLines.map((name) => name[0]).join('')), `personal welcome mark appears in ${MODE} mode`);

    // 5. Over quickly. The short mode gets a tighter budget because it is what a
    // returning visitor sees on every refresh.
    assert(duration >= timing.hold + timing.handoff * 1000 - 100 && duration < timing.budget, `connected ${MODE} scene lasts ${Math.round(duration)}ms (budget ${timing.budget}ms)`);
    assert(errors.length === 0, `no runtime errors (${errors.join('; ') || 'none'})`);
    console.log(JSON.stringify({ mode: MODE, width: WIDTH, duration: Math.round(duration), readable: Math.round(readable), flightSamples: flights.length }));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-intro-overlay]');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]'));
    assert(await page.locator('[data-hero-name-target]').evaluateAll((names) => names.length === 2 && names.every((name) => getComputedStyle(name).opacity === '1')), 'Escape skips directly to visible hero names');
    assert(await page.evaluate(() => document.documentElement.style.overflow !== 'hidden'), 'Escape releases the scroll lock');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-intro-phase="handoff"]');
    await page.setViewportSize({ width: WIDTH < 768 ? 1440 : 390, height: 900 });
    await page.waitForFunction(() => !document.querySelector('[data-intro-overlay]'));
    assert(await page.locator('[data-hero-name-target]').evaluateAll((names) => names.every((name) => {
        const r = name.getBoundingClientRect();
        return getComputedStyle(name).opacity === '1' && r.left >= -1 && r.right <= innerWidth + 1;
    })), 'resizing during flight finishes safely at the responsive hero layout');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'networkidle' });
    assert(await page.locator('[data-intro-overlay]').count() === 0 && await page.locator('[data-hero-name-target]').evaluateAll((names) => names.every((name) => getComputedStyle(name).opacity === '1')), 'reduced motion has no overlay and no hidden hero name');
    const deepPage = await browser.newPage({ viewport: { width: WIDTH, height: WIDTH < 768 ? 800 : 900 } });
    await deepPage.goto(`${BASE.replace(/\/$/, '')}/#work`, { waitUntil: 'networkidle' });
    await deepPage.waitForFunction(() => {
        const work = document.getElementById('work');
        return work && Math.abs(work.getBoundingClientRect().top) < 180;
    }, null, { timeout: 5000 });
    const deep = await deepPage.evaluate(() => ({ overlay: Boolean(document.querySelector('[data-intro-overlay]')), top: document.getElementById('work').getBoundingClientRect().top }));
    assert(!deep.overlay && Math.abs(deep.top) < 180, `deep work links bypass the welcome and preserve their destination (${Math.round(deep.top)}px)`);
    await deepPage.close();
} catch (error) {
    assert(false, error.stack ?? error.message);
} finally {
    await browser.close();
}
process.exitCode = failures ? 1 : 0;
