import { useEffect } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll } from 'framer-motion';
import { usePrefersReducedMotion } from './useMediaQuery';

// Scroll progress through one pipeline stage, LATCHED so it only ever rises.
//
// Two reasons it must latch rather than track scroll directly:
//
//  1. UX. Scrolling back up should not un-build a pipeline you just watched
//     assemble. A raw scrubbed value plays the whole build in reverse, which
//     reads as a glitch rather than as an effect.
//
//  2. It would break the reveal audit. scripts/audit-reveals.mjs scrolls the
//     whole page, returns to the top and fails if anything is still hidden —
//     it is what caught 29 permanently invisible words in the About section.
//     With a raw scrubbed value every node in the later stages is legitimately
//     at opacity 0 once you are back at the top, and the check fails. Latching
//     makes it pass for the right reason instead of excluding it.
//
// Motion values are written, not React state, so the latch costs no renders.
export function useStageProgress(ref, { offset = ['start 80%', 'end 60%'] } = {}) {
    const reducedMotion = usePrefersReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset });
    const latched = useMotionValue(0);

    useMotionValueEvent(scrollYProgress, 'change', (value) => {
        if (value > latched.get()) latched.set(value);
    });

    useEffect(() => {
        // Reduced motion gets the finished state immediately — nothing builds.
        if (reducedMotion) latched.set(1);
    }, [reducedMotion, latched]);

    return latched;
}

export default useStageProgress;
