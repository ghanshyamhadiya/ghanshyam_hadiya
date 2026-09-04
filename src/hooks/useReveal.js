import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery';
import useBooted from './useBooted';

// One shared scroll-reveal system for the whole site.
//
// Replaces per-element `whileInView`, which failed in two ways that were very
// visible on a phone:
//
//   1. It fails CLOSED. If the observer misses — fast flick scrolling, Lenis
//      smoothing, a hash jump — the element keeps its initial hidden state
//      forever while still occupying layout, so you get a blank gap rather
//      than an obvious error. Measured: 29 words in About and the whole
//      Contact headline never appeared after a full scroll.
//   2. One observer per element. Word-by-word text meant ~200 observers on a
//      single page, which is both slow and where most of the misses happened.
//
// This version uses a single shared observer plus three fail-safes, so content
// can never end up permanently invisible:
//   - reveal on intersection
//   - reveal immediately if the element is already at or above the fold when
//     it mounts (measured in the ref callback, at attach time)
//   - a delayed sweep that reveals anything the observer never fired for

const registry = new Map();
let observer = null;
let sweepQueued = false;

const REVEAL_MARGIN = 0.12; // fraction of viewport height held back below the fold

function ensureObserver() {
    if (observer || typeof window === 'undefined') return observer;

    observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const reveal = registry.get(entry.target);
                if (!reveal) continue;
                reveal();
                registry.delete(entry.target);
                observer.unobserve(entry.target);
            }
        },
        // Trigger as soon as any pixel enters, minus a small bottom inset so
        // the motion reads as deliberate rather than late. No negative top
        // margin — that was what made upward scrolling miss.
        { threshold: 0, rootMargin: `0px 0px -${Math.round(REVEAL_MARGIN * 100)}% 0px` }
    );

    return observer;
}

// Catches anything the observer never fired for. Only walks still-pending
// elements, and each is dropped from the registry as soon as it is revealed.
function sweep() {
    for (const [element, reveal] of [...registry]) {
        if (element.getBoundingClientRect().top < window.innerHeight * 1.15) {
            reveal();
            registry.delete(element);
            observer?.unobserve(element);
        }
    }
    sweepQueued = false;
}

// The sweep is driven by scroll as well as a timeout, not a single delayed
// pass. A one-shot timeout still left the occasional heading stranded, because
// an element can be registered long before it is ever scrolled near. Running a
// throttled check on scroll makes the guarantee unconditional: anything that
// reaches the viewport is revealed whether the observer fired or not.
function queueSweep() {
    if (sweepQueued || typeof window === 'undefined') return;
    sweepQueued = true;
    requestAnimationFrame(sweep);
}

function ensureSweepListener() {
    if (typeof window === 'undefined' || ensureSweepListener.attached) return;
    ensureSweepListener.attached = true;

    const onScroll = () => {
        if (registry.size) queueSweep();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
}

export function useReveal() {
    const reducedMotion = usePrefersReducedMotion();
    // Nothing reveals while the intro curtain is still up, otherwise
    // above-the-fold content finishes animating before it is ever visible.
    const booted = useBooted();
    const [revealed, setRevealed] = useState(false);
    const nodeRef = useRef(null);

    // Measuring in the ref callback rather than an effect body: this runs at
    // attach time, so already-visible content shows immediately without a
    // synchronous setState inside useEffect.
    const ref = useCallback(
        (node) => {
            nodeRef.current = node;
            if (!node || typeof window === 'undefined' || !booted) return;

            if (node.getBoundingClientRect().top < window.innerHeight * (1 - REVEAL_MARGIN)) {
                setRevealed(true);
            }
        },
        [booted]
    );

    useEffect(() => {
        const element = nodeRef.current;
        if (!element || reducedMotion || revealed || !booted) return undefined;

        registry.set(element, () => setRevealed(true));
        ensureObserver().observe(element);
        ensureSweepListener();
        // Runs on the next frame, so anything already on screen when the
        // curtain lifts animates in rather than snapping.
        queueSweep();

        return () => {
            registry.delete(element);
            observer?.unobserve(element);
        };
    }, [reducedMotion, revealed, booted]);

    return [ref, revealed || reducedMotion];
}

export default useReveal;
