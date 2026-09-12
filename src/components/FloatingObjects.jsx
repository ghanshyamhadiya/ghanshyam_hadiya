import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../utils/cn';
import { usePrefersReducedMotion, useIsTouch } from '../hooks/useMediaQuery';

// Tilted cards that drift around the portrait, the way the reference site
// floats books around its hero.
//
// Pointer parallax runs through motion values rather than React state, so
// moving the mouse never triggers a render — the same reason the cursor was
// rewritten earlier. Each card also carries an independent CSS float so the
// group still feels alive when the pointer is still.
//
// Skipped entirely on touch (no pointer to parallax) and under reduced motion.
const Card = ({ item, index, mx, my }) => {
    // Alternating depth so the group separates rather than moving as a slab.
    const depth = (index % 3) + 1;
    const x = useTransform(mx, (v) => v * depth * 8);
    const y = useTransform(my, (v) => v * depth * 8);

    return (
        <motion.div
            style={{
                x,
                y,
                top: item.top,
                left: item.left,
                right: item.right,
                bottom: item.bottom,
                rotate: item.rotate,
            }}
            className="absolute"
        >
            <div
                data-floating-chip={item.label}
                className={cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2.5 shadow-[0_10px_30px_-12px_rgba(20,18,37,0.4)]',
                    'font-mono text-[0.68rem] font-medium tracking-[0.06em] sm:text-[0.75rem]',
                    item.className
                )}
                style={{ animation: `float-y ${5 + index}s ease-in-out ${index * 0.6}s infinite` }}
            >
                {item.label}
            </div>
        </motion.div>
    );
};

const FloatingObjects = ({ items, className }) => {
    const reducedMotion = usePrefersReducedMotion();
    const isTouch = useIsTouch();
    const ref = useRef(null);

    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const mx = useSpring(rawX, { stiffness: 120, damping: 24, mass: 0.6 });
    const my = useSpring(rawY, { stiffness: 120, damping: 24, mass: 0.6 });

    const disabled = reducedMotion || isTouch;

    useEffect(() => {
        if (disabled) return undefined;

        const onMove = (event) => {
            // -1..1 relative to viewport centre.
            rawX.set((event.clientX / window.innerWidth) * 2 - 1);
            rawY.set((event.clientY / window.innerHeight) * 2 - 1);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, [disabled, rawX, rawY]);

    if (!items?.length) return null;

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className={cn('pointer-events-none absolute inset-0', className)}
        >
            {items.map((item, index) => (
                <Card key={item.label} item={item} index={index} mx={mx} my={my} />
            ))}
        </div>
    );
};

export default FloatingObjects;
