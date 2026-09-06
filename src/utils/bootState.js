// Tracks whether the intro curtain has lifted.
//
// Entry animations must not start until the page is actually visible. Measured
// before this existed: the hero headline animated from y=202 to y=0 between
// 579ms and 1464ms, while the preloader did not clear until 3184ms — the whole
// entry sequence played behind the curtain and the page appeared already
// settled. Only on a first load, because the intro is session-scoped and
// skipped on later visits, which is what made it easy to miss.
//
// A module-level store rather than context: `useReveal` is called from almost
// every component, and this avoids threading a provider through all of them
// while still being synchronous on the very first render.

const KEY = 'intro-played';

const prefersReducedMotion = () => {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
};

const introAlreadyPlayed = () => {
    try {
        return window.sessionStorage.getItem(KEY) === '1';
    } catch {
        // Storage blocked — treat it as not played; the intro simply replays.
        return false;
    }
};

// The intro now runs on EVERY load, not once per tab.
//
// It used to be skipped whenever the stored flag was set, and because
// sessionStorage survives a refresh, pressing F5 silently skipped it — only a
// brand new tab ever replayed it.
//
// The stored flag now selects a LENGTH instead of skipping: the first load of a
// session plays in full so the name lands, and every refresh after that plays a
// short version so it never becomes a toll gate.
export const shouldPlayIntro = () => {
    if (typeof window === 'undefined') return false;
    return !prefersReducedMotion();
};

export const introDuration = () => (introAlreadyPlayed() ? 'short' : 'full');

export const markIntroPlayed = () => {
    try {
        window.sessionStorage.setItem(KEY, '1');
    } catch {
        /* storage blocked — the intro replays next load */
    }
};

// Evaluated once at import. When the intro is skipped entirely — reduced motion
// or no DOM — this is already true, so nothing ever waits on a gate.
let booted = typeof window === 'undefined' ? true : !shouldPlayIntro();

const listeners = new Set();

export const getBooted = () => booted;

export const setBooted = () => {
    if (booted) return;
    booted = true;
    for (const listener of listeners) listener();
};

export const subscribeBooted = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

// Server snapshot is true: without JS timing there is nothing to gate.
export const getBootedServerSnapshot = () => true;
