import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Splits a string into words and reveals them one by one on scroll.
const AnimatedText = ({
    text,
    className,
    wordClassName,
    delay = 0,
    stagger = 0.03,
    as = 'p',
}) => {
    const reducedMotion = usePrefersReducedMotion();
    const Tag = as;

    if (reducedMotion) return <Tag className={className}>{text}</Tag>;

    return (
        <Tag className={className}>
            {text.split(' ').map((word, index) => (
                <motion.span
                    key={`${word}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewport}
                    transition={{
                        duration: 0.5,
                        delay: delay + index * stagger,
                        ease: EASE_OUT_EXPO,
                    }}
                    className={cn('inline-block mr-[0.28em]', wordClassName)}
                >
                    {word}
                </motion.span>
            ))}
        </Tag>
    );
};

export default AnimatedText;
