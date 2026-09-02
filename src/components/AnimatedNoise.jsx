import React from 'react';

const AnimatedNoise = () => {
    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] h-full w-full opacity-[0.035] mix-blend-overlay">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">
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
