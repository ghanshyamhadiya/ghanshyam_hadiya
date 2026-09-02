import React from 'react';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Film grain over the whole page. Toned down from 0.035 to 0.02 so it reads as
// paper texture rather than an effect, and skipped entirely for users who have
// asked for reduced motion.
const AnimatedNoise = () => {
    const reducedMotion = usePrefersReducedMotion();
    if (reducedMotion) return null;

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[9999] h-full w-full opacity-[0.02] mix-blend-overlay"
        >
            <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
            >
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.65"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
        </div>
    );
};

export default AnimatedNoise;
