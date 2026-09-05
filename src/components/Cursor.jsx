import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useIsTouch, usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Soft blob cursor.
//
// The previous copper crosshair suited a dark technical grid; on a warm cream
// canvas it reads as a targeting reticle in a picture book. This is a rounded
// blob that swells over interactive elements and can carry a label via
// `data-cursor="..."` on any element.
//
// Position runs through motion values, not state, so pointer movement never
// re-renders React.
const Cursor = () => {
    const isTouch = useIsTouch();
    const reducedMotion = usePrefersReducedMotion();
    const disabled = isTouch || reducedMotion;

    const x = useMotionValue(-200);
    const y = useMotionValue(-200);
    const bx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.35 });
    const by = useSpring(y, { stiffness: 500, damping: 40, mass: 0.35 });

    const [hovered, setHovered] = useState(false);
    const [label, setLabel] = useState('');

    useEffect(() => {
        if (disabled) return undefined;

        document.body.classList.add('has-blob-cursor');

        const onMove = (event) => {
            x.set(event.clientX);
            y.set(event.clientY);

            const interactive = event.target.closest?.(
                'a, button, [role="button"], input, textarea, select, [data-cursor]'
            );
            setHovered(Boolean(interactive));
            setLabel(interactive?.dataset?.cursor ?? '');
        };

        const onLeave = () => {
            x.set(-200);
            y.set(-200);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        document.addEventListener('mouseleave', onLeave);

        return () => {
            document.body.classList.remove('has-blob-cursor');
            window.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseleave', onLeave);
        };
    }, [disabled, x, y]);

    if (disabled) return null;

    return (
        <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-[9997] flex items-center justify-center rounded-full bg-pink text-ink"
            style={{ x: bx, y: by, translateX: '-50%', translateY: '-50%' }}
            animate={{
                width: label ? 'auto' : hovered ? 56 : 18,
                height: label ? 34 : hovered ? 56 : 18,
                paddingLeft: label ? 16 : 0,
                paddingRight: label ? 16 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        >
            {label && (
                <span className="whitespace-nowrap font-display text-[0.75rem] font-semibold">
                    {label}
                </span>
            )}
        </motion.div>
    );
};

export default Cursor;
