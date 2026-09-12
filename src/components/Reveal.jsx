import React from 'react';
import { motion } from 'framer-motion';
import useReveal from '../hooks/useReveal';
import { EASE_OUT_EXPO, REVEAL_DISTANCE, REVEAL_SPRING } from '../utils/motion';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import useHeadingVelocity from '../hooks/useHeadingVelocity';

// The single scroll-reveal used across the whole site, so every section shares
// one distance, duration and easing. Ad-hoc `whileInView` values had drifted to
// four different distances and four different durations, which is what made
// the page feel inconsistent as you scrolled.
//
// Two variants:
//   'fade'  — opacity + a short rise (default)
//   'mask'  — slides up from behind an overflow-hidden parent, for headings
const Reveal = ({
    children,
    as = 'div',
    variant = 'fade',
    delay = 0,
    duration,
    distance = REVEAL_DISTANCE,
    className,
    ...rest
}) => {
    const [ref, visible] = useReveal();
    const reducedMotion = usePrefersReducedMotion();
    const entranceDelay = useHeadingVelocity(visible, delay);
    const Component = motion[as] ?? motion.div;
    const timing = reducedMotion
        ? { duration: 0, delay: 0 }
        : duration !== undefined
          ? { duration, delay, ease: EASE_OUT_EXPO }
          : {
                ...REVEAL_SPRING,
                delay: entranceDelay,
                opacity: { duration: 0.28, delay: entranceDelay, ease: EASE_OUT_EXPO },
            };

    const hidden =
        variant === 'mask' ? { y: '105%' } : { opacity: 0, y: distance };
    const shown = variant === 'mask' ? { y: '0%' } : { opacity: 1, y: 0 };

    return (
        <Component
            ref={ref}
            initial={reducedMotion ? false : hidden}
            animate={visible ? shown : hidden}
            transition={timing}
            className={className}
            {...rest}
        >
            {children}
        </Component>
    );
};

export default Reveal;
