// Shared easing curves and motion presets so every section animates
// with the same rhythm.

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT = [0.65, 0, 0.35, 1];

export const transition = {
    fast: { duration: 0.4, ease: EASE_OUT_EXPO },
    base: { duration: 0.7, ease: EASE_OUT_EXPO },
    slow: { duration: 1.1, ease: EASE_OUT_EXPO },
    spring: { type: 'spring', stiffness: 260, damping: 30, mass: 0.6 },
};

// Default viewport config for scroll-triggered reveals.
export const viewport = { once: true, margin: '-80px' };

export const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: transition.base },
};

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transition.base },
};

// Parent wrapper that staggers its children.
export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren } },
});

// A single word/line sliding up from behind a mask.
export const maskUp = {
    hidden: { y: '110%' },
    visible: { y: '0%', transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
};
