// Device tiering and the degradation ladder.
//
// A full-page render loop on a mid-range Android is the single biggest risk in
// this design, so quality is never assumed: a starting tier is guessed from
// what the device reports, then the real measured frame time is allowed to
// walk it down. The bottom rung is a still frame rather than a permanently
// stuttering animation — a static composition reads as deliberate, dropped
// frames read as broken.

// Each rung is strictly cheaper than the one above it in the order a GPU
// actually cares about: resolution first, then lighting, then geometry.
export const LEVELS = [
    { name: 'high', dpr: 1.6, shadows: true, segments: 4, particles: 220, animate: true },
    { name: 'medium', dpr: 1.25, shadows: false, segments: 3, particles: 140, animate: true },
    { name: 'low', dpr: 1, shadows: false, segments: 2, particles: 70, animate: true },
    { name: 'static', dpr: 1, shadows: false, segments: 2, particles: 0, animate: false },
];

// 60fps allows 16.7ms; 30fps allows 33.3ms. The budget is deliberately looser
// than the target so ordinary GC pauses do not trigger a downgrade.
export const FRAME_BUDGET = { desktop: 22, mobile: 36 };

export const detectTier = () => {
    if (typeof window === 'undefined') return LEVELS.length - 1;
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = navigator.deviceMemory ?? 4;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    if (cores <= 4 || memory <= 2) return 2;
    if (coarse || window.innerWidth < 768) return 1;
    return 0;
};

export function createQuality({ onChange, budget } = {}) {
    let index = detectTier();
    const ceiling = budget ?? (window.matchMedia?.('(pointer: coarse)').matches ? FRAME_BUDGET.mobile : FRAME_BUDGET.desktop);
    // A ring of recent frame times. p95 over a window, not an average: an
    // average hides exactly the periodic spikes that read as jank.
    const window_ = new Float32Array(60);
    let count = 0;
    let cursor = 0;
    let sinceChange = 0;
    let p95 = 0;

    const level = () => LEVELS[index];
    const step = (next) => {
        if (next === index || next < 0 || next >= LEVELS.length) return false;
        index = next;
        count = 0;
        cursor = 0;
        sinceChange = 0;
        onChange?.(level());
        return true;
    };

    return {
        get level() { return level(); },
        get index() { return index; },
        get budget() { return ceiling; },
        // The last measured p95, published so the perf bar is checkable from
        // outside. Frame RATE cannot stand in for it: headless and vsynced
        // browsers both cap rAF regardless of how cheap a frame really is.
        get p95() { return p95; },
        // Returns true when the caller should re-read the level.
        sample(frameMs) {
            window_[cursor] = frameMs;
            cursor = (cursor + 1) % window_.length;
            count = Math.min(count + 1, window_.length);
            sinceChange += 1;
            if (count < window_.length) return false;
            const sorted = Array.from(window_.slice(0, count)).sort((a, b) => a - b);
            p95 = sorted[Math.floor(sorted.length * 0.95)];
            // Measure always, but ignore the first full window after a change
            // when deciding: the frame right after a pixel-ratio change is
            // always expensive and would cascade all the way down to static on
            // a perfectly capable machine.
            if (sinceChange < window_.length) return false;
            if (p95 > ceiling) return step(index + 1);
            return false;
        },
        force(name) {
            const next = LEVELS.findIndex((entry) => entry.name === name);
            return step(next);
        },
        reset() {
            count = 0;
            cursor = 0;
            sinceChange = 0;
        },
    };
}
