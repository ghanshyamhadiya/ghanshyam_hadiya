import React from 'react';
import { cn } from '../utils/cn';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Infinite ticker band.
//
// The track renders the items twice and translates exactly -50%, so the loop is
// seamless with no JS and no measurement. Driven by a CSS keyframe rather than
// framer-motion because it runs forever — keeping it off the animation
// framework's tick means it costs nothing per frame on the main thread.
//
// Under reduced motion it becomes a static, horizontally scrollable strip
// rather than disappearing, so the content is still reachable.
const Marquee = ({
    items,
    speed = 38,
    reverse = false,
    className,
    separator = '✦',
}) => {
    const reducedMotion = usePrefersReducedMotion();
    if (!items?.length) return null;

    const track = [...items, ...items];

    return (
        <div
            className={cn('relative overflow-hidden', className)}
            role="presentation"
        >
            <div
                className={cn(
                    'flex w-max items-center gap-6 whitespace-nowrap sm:gap-10',
                    reducedMotion && 'no-scrollbar overflow-x-auto'
                )}
                style={
                    reducedMotion
                        ? undefined
                        : {
                              animation: `marquee ${speed}s linear infinite`,
                              animationDirection: reverse ? 'reverse' : 'normal',
                              willChange: 'transform',
                          }
                }
            >
                {track.map((item, index) => (
                    <span key={`${item}-${index}`} className="flex shrink-0 items-center gap-6 sm:gap-10">
                        <span className="font-display text-xl sm:text-3xl">{item}</span>
                        <span aria-hidden="true" className="text-base opacity-50 sm:text-xl">
                            {separator}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default Marquee;
