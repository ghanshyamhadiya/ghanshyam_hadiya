import React from 'react';
import { motion } from 'framer-motion';
import Marquee from './Marquee';
import { marqueeItems } from '../data';
import useScrollVelocity from '../hooks/useScrollVelocity';

// Two tilted ticker bands crossing each other, scrolling in opposite
// directions — the reference site's pattern, and far more alive than the single
// flat strip this replaces.
//
// Rotation exposes the band corners, so each one is over-width and pulled left;
// the wrapper clips it. Without that the tilt produces horizontal page overflow,
// which the shoot script asserts against.
// Generous vertical padding is load-bearing, not decoration. The two bands tilt
// in opposite directions, so they converge at one end; without padding to
// absorb that the front band slices the rear band's text through the middle of
// its glyphs, which reads as a bug rather than as layered tape.
const Band = ({ rotate, className, children }) => (
    <div
        className={`relative w-[118%] -ml-[9%] border-y-2 border-ink py-5 sm:py-6 ${className}`}
        style={{ rotate: `${rotate}deg` }}
    >
        {children}
    </div>
);

const MarqueeBand = () => {
    const { blur, skew } = useScrollVelocity({ maxBlur: 2.5, maxSkew: 2 });

    return (
        <div className="relative z-20 -my-6 overflow-hidden py-8 sm:-my-8 sm:py-10">
            <motion.div style={{ filter: blur, skewY: skew }}>
                <Band rotate={-1.8} className="bg-pink text-ink">
                    <Marquee items={marqueeItems} speed={44} separator="✦" />
                </Band>

                <Band rotate={1.5} className="-mt-1 bg-indigo text-canvas">
                    <Marquee items={marqueeItems} speed={38} reverse separator="◆" />
                </Band>
            </motion.div>
        </div>
    );
};

export default MarqueeBand;
