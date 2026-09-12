import { useRef } from 'react';
import { useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from './useMediaQuery';
import { SCROLL_GLIDE } from '../utils/motion';

const DEFAULT_OFFSET = ['start 90%', 'end 15%'];

const useGlideProgress = (ref, offset = DEFAULT_OFFSET) => {
    const reducedMotion = usePrefersReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset });
    const progress = useSpring(scrollYProgress, SCROLL_GLIDE);
    const still = useMotionValue(0);
    const previous = useRef(0);

    useMotionValueEvent(scrollYProgress, 'change', (value) => {
        if (Math.abs(value - previous.current) > 0.35) progress.jump(value);
        previous.current = value;
    });

    return { progress: reducedMotion ? still : progress, rawProgress: scrollYProgress, reducedMotion };
};

export default useGlideProgress;
