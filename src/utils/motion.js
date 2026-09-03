// Shared easing and motion constants. Every scroll reveal on the site goes
// through <Reveal> / useReveal and uses these values, so the whole page moves
// with one rhythm — previously each section had drifted to its own distance
// and duration, which read as inconsistent while scrolling.

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT = [0.65, 0, 0.35, 1];

// The single reveal vocabulary.
export const REVEAL_DISTANCE = 16;
export const REVEAL_DURATION = 0.5;
export const REVEAL_STAGGER = 0.05;
// Caps cumulative delay so a long list never leaves the last item waiting.
export const MAX_STAGGER_STEPS = 6;

export const stagger = (index) =>
    Math.min(index, MAX_STAGGER_STEPS) * REVEAL_STAGGER;

export const transition = {
    fast: { duration: 0.3, ease: EASE_OUT_EXPO },
    base: { duration: REVEAL_DURATION, ease: EASE_OUT_EXPO },
    slow: { duration: 0.8, ease: EASE_OUT_EXPO },
    spring: { type: 'spring', stiffness: 260, damping: 30, mass: 0.6 },
};

// Kept for the few hero/preloader animations that run on mount rather than on
// scroll, where framer's own viewport handling is not involved.
export const viewport = { once: true, amount: 0 };
