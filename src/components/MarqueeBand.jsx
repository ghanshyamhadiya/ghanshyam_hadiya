import React, { useId, useState } from 'react';
import Marquee from './Marquee';
import { marqueeItems } from '../data';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

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
const Band = ({ className, children }) => (
    <div
        data-marquee-band
        className={`relative w-full min-w-0 border-y border-line ${className}`}
    >
        {children}
    </div>
);

const MarqueeBand = () => {
    const [paused, setPaused] = useState(false);
    const reducedMotion = usePrefersReducedMotion();
    const id = useId();
    const firstId = `${id}-tools-left`;

    return (
        <div data-marquee-wrapper className="relative flex flex-col gap-3 bg-canvas py-4">
            <Band className="bg-canvas text-muted">
                <Marquee id={firstId} items={marqueeItems} paused={paused} label={reducedMotion ? 'Tools I work with' : 'Tools I work with, moving left'} separator="/" />
            </Band>

            {!reducedMotion && (
                <div className="mx-auto flex w-full max-w-6xl justify-end px-5 sm:px-8">
                    <button
                        type="button"
                        data-marquee-toggle
                        aria-controls={firstId}
                        aria-pressed={paused}
                        onClick={() => setPaused((value) => !value)}
                        className="min-h-11 rounded-full border border-line px-4 text-xs font-medium text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-offset-2"
                    >
                        {paused ? 'Resume ticker' : 'Pause ticker'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MarqueeBand;
