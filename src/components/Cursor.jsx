import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useIsTouch, usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Custom pointer, toned down for the editorial redesign: a small copper ring
// that grows slightly over interactive elements, instead of the previous 80px
// blend-difference blob. Skipped on touch devices and under reduced motion.
const Cursor = () => {
    const isTouch = useIsTouch();
    const reducedMotion = usePrefersReducedMotion();
    const disabled = isTouch || reducedMotion;

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (disabled) return undefined;

        const onMouseMove = (event) => {
            setPosition({ x: event.clientX, y: event.clientY });

            const target = event.target;
            setIsHovered(
                Boolean(
                    target.closest?.('a') ||
                        target.closest?.('button') ||
                        target.closest?.('[role="button"]')
                )
            );
        };

        window.addEventListener('mousemove', onMouseMove);
        return () => window.removeEventListener('mousemove', onMouseMove);
    }, [disabled]);

    if (disabled) return null;

    return (
        <>
            {/* Precise dot */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed left-0 top-0 z-[9998] h-1 w-1 rounded-full bg-accent"
                animate={{ x: position.x - 2, y: position.y - 2, opacity: isHovered ? 0 : 1 }}
                transition={{ type: 'spring', stiffness: 900, damping: 40, mass: 0.25 }}
            />

            {/* Trailing ring */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-accent/60"
                animate={{
                    x: position.x - (isHovered ? 20 : 11),
                    y: position.y - (isHovered ? 20 : 11),
                    width: isHovered ? 40 : 22,
                    height: isHovered ? 40 : 22,
                    opacity: isHovered ? 1 : 0.5,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.5 }}
            />
        </>
    );
};

export default Cursor;
