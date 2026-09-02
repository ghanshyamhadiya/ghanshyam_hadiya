import React from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

const OFFSETS = {
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
    none: { x: 0, y: 0 },
};

// Generic scroll-triggered reveal used across every section so the whole page
// shares one animation language.
const Reveal = ({
    children,
    as = 'div',
    direction = 'up',
    delay = 0,
    duration = 0.7,
    className,
    once = true,
    ...rest
}) => {
    const reducedMotion = usePrefersReducedMotion();
    const offset = OFFSETS[direction] ?? OFFSETS.up;
    const Component = motion[as] ?? motion.div;

    if (reducedMotion) {
        const Static = as;
        return (
            <Static className={className} {...rest}>
                {children}
            </Static>
        );
    }

    return (
        <Component
            initial={{ opacity: 0, ...offset }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ ...viewport, once }}
            transition={{ duration, delay, ease: EASE_OUT_EXPO }}
            className={className}
            {...rest}
        >
            {children}
        </Component>
    );
};

export default Reveal;
