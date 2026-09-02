import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useIsTouch, usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Subtle magnetic pull toward the cursor. Pull strength reduced from 0.3 to
// 0.15 for the refined redesign, and the listeners are skipped on touch devices
// where the mousemove maths could never fire.
const Magnetic = ({ children }) => {
    const ref = useRef(null);
    const isTouch = useIsTouch();
    const reducedMotion = usePrefersReducedMotion();
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const disabled = isTouch || reducedMotion;

    const handleMouse = (event) => {
        if (disabled || !ref.current) return;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        setPosition({
            x: (event.clientX - (left + width / 2)) * 0.15,
            y: (event.clientY - (top + height / 2)) * 0.15,
        });
    };

    const reset = () => setPosition({ x: 0, y: 0 });

    if (disabled) return children;

    return (
        <motion.div
            style={{ position: 'relative', display: 'inline-block' }}
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
        >
            {children}
        </motion.div>
    );
};

export default Magnetic;
