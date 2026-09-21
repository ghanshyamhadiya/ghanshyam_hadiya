import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

// The rail the whole run hangs off: a track, a fill that follows scroll, and a
// payload token riding the fill's leading edge.
//
// The fill uses the same scroll-driven scaleY already proven on the experience
// timeline. The token is positioned by `top` rather than transformed, so the
// percentage resolves against the rail's own height at any viewport size.
const Spine = ({ progress }) => {
    const reducedMotion = usePrefersReducedMotion();

    const smooth = useSpring(progress, { stiffness: 90, damping: 26, mass: 0.4 });
    const top = useTransform(smooth, (v) => `${Math.min(Math.max(v, 0), 1) * 100}%`);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-3 top-0 w-0.5 sm:left-5"
        >
            <span className="absolute inset-0 rounded-full bg-canvas/15" />

            <motion.span
                style={{ scaleY: smooth }}
                className="absolute inset-0 origin-top rounded-full bg-amber"
            />

            {!reducedMotion && (
                <motion.span style={{ top }} className="absolute left-1/2 -translate-x-1/2">
                    <span className="relative block h-3 w-3 -translate-y-1/2 rounded-full bg-amber" />
                </motion.span>
            )}
        </div>
    );
};

export default Spine;
