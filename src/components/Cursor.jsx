import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useIsTouch, usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Technical crosshair cursor.
//
// Position is held in motion values, not React state. The previous version
// called setState on every mousemove, re-rendering the component (and its
// subtree) at pointer frequency; motion values write straight to the transform
// so React never re-renders while the pointer moves. Only the discrete
// hover/press flags go through state.
//
// Composition:
//   - a 1px full-viewport crosshair that tracks the pointer on both axes
//   - a square reticle with four corner brackets that open on interactive hover
//   - a live mono coordinate readout
// Defined at module scope, not inside Cursor — a component created during
// render gets a new identity every frame, so React remounts it instead of
// updating it.
const Corner = ({ size, style }) => (
    <motion.span
        className="absolute border-accent"
        animate={{ width: size, height: size }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        style={style}
    />
);

const Cursor = () => {
    const isTouch = useIsTouch();
    const reducedMotion = usePrefersReducedMotion();
    const disabled = isTouch || reducedMotion;

    const x = useMotionValue(-100);
    const y = useMotionValue(-100);

    // Two follow speeds: the reticle lags slightly behind the crosshair, which
    // is what makes the movement feel weighted rather than glued to the mouse.
    const sharp = { stiffness: 1400, damping: 70, mass: 0.25 };
    const lagged = { stiffness: 260, damping: 26, mass: 0.6 };

    const crossX = useSpring(x, sharp);
    const crossY = useSpring(y, sharp);
    const ringX = useSpring(x, lagged);
    const ringY = useSpring(y, lagged);

    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const [label, setLabel] = useState('');
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    // Throttle the coordinate readout to ~15fps; it's decorative and does not
    // need to re-render at pointer frequency.
    const lastCoordWrite = useRef(0);

    useEffect(() => {
        if (disabled) return undefined;

        document.body.classList.add('has-crosshair');

        const onMove = (event) => {
            x.set(event.clientX);
            y.set(event.clientY);

            const now = performance.now();
            if (now - lastCoordWrite.current > 66) {
                lastCoordWrite.current = now;
                setCoords({ x: Math.round(event.clientX), y: Math.round(event.clientY) });
            }

            const target = event.target;
            const interactive = target.closest?.(
                'a, button, [role="button"], input, textarea, select, [data-cursor]'
            );

            setHovered(Boolean(interactive));
            setLabel(interactive?.dataset?.cursor ?? '');
        };

        const onDown = () => setPressed(true);
        const onUp = () => setPressed(false);
        const onLeave = () => {
            x.set(-100);
            y.set(-100);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mousedown', onDown);
        window.addEventListener('mouseup', onUp);
        document.addEventListener('mouseleave', onLeave);

        return () => {
            document.body.classList.remove('has-crosshair');
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('mouseup', onUp);
            document.removeEventListener('mouseleave', onLeave);
        };
    }, [disabled, x, y]);

    // Reticle geometry reacts to hover/press.
    const size = hovered ? 46 : 22;
    const bracket = hovered ? 11 : 6;
    const gap = hovered ? 5 : 0;

    const ringLeft = useTransform(ringX, (v) => v - size / 2);
    const ringTop = useTransform(ringY, (v) => v - size / 2);

    if (disabled) return null;

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9997]">
            {/* Full-viewport crosshair */}
            <motion.span
                className="absolute left-0 top-0 h-px w-full bg-accent/25"
                style={{ y: crossY }}
            />
            <motion.span
                className="absolute left-0 top-0 h-full w-px bg-accent/25"
                style={{ x: crossX }}
            />

            {/* Reticle */}
            <motion.div
                className="absolute left-0 top-0"
                style={{ x: ringLeft, y: ringTop }}
                animate={{ width: size, height: size, rotate: pressed ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
                <Corner
                    size={bracket}
                    style={{ top: -gap, left: -gap, borderTopWidth: 1, borderLeftWidth: 1 }}
                />
                <Corner
                    size={bracket}
                    style={{ top: -gap, right: -gap, borderTopWidth: 1, borderRightWidth: 1 }}
                />
                <Corner
                    size={bracket}
                    style={{ bottom: -gap, left: -gap, borderBottomWidth: 1, borderLeftWidth: 1 }}
                />
                <Corner
                    size={bracket}
                    style={{ bottom: -gap, right: -gap, borderBottomWidth: 1, borderRightWidth: 1 }}
                />

                {/* Centre dot, hidden while hovering so the brackets read clearly */}
                <motion.span
                    className="absolute left-1/2 top-1/2 bg-accent"
                    animate={{
                        width: hovered ? 0 : 3,
                        height: hovered ? 0 : 3,
                        x: '-50%',
                        y: '-50%',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </motion.div>

            {/* Coordinate / label readout */}
            <motion.div
                className="absolute left-0 top-0 whitespace-nowrap font-mono text-[0.6rem] tracking-[0.1em] text-accent/70"
                style={{ x: ringX, y: ringY }}
            >
                <motion.span
                    className="absolute block"
                    animate={{ opacity: hovered ? 1 : 0.55, x: hovered ? 32 : 16, y: 14 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                >
                    {label || `${String(coords.x).padStart(4, '0')}·${String(coords.y).padStart(4, '0')}`}
                </motion.span>
            </motion.div>
        </div>
    );
};

export default Cursor;
