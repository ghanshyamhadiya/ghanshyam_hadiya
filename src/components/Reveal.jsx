import React from 'react';
import { motion } from 'framer-motion';
import useReveal from '../hooks/useReveal';
import { EASE_OUT_EXPO, REVEAL_DISTANCE, REVEAL_DURATION } from '../utils/motion';

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
    duration = REVEAL_DURATION,
    distance = REVEAL_DISTANCE,
    className,
    ...rest
}) => {
    const [ref, visible] = useReveal();
    const Component = motion[as] ?? motion.div;

    const hidden =
        variant === 'mask' ? { y: '105%' } : { opacity: 0, y: distance };
    const shown = variant === 'mask' ? { y: '0%' } : { opacity: 1, y: 0 };

    return (
        <Component
            ref={ref}
            initial={hidden}
            animate={visible ? shown : hidden}
            transition={{ duration, delay, ease: EASE_OUT_EXPO }}
            className={className}
            {...rest}
        >
            {children}
        </Component>
    );
};

export default Reveal;
