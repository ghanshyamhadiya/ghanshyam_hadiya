import React, { useEffect, useRef, useState } from 'react';
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
    speed = 26,
    reverse = false,
    paused = false,
    id,
    label = 'Tools I work with',
    className,
    separator = '✦',
}) => {
    const reducedMotion = usePrefersReducedMotion();
    const viewportRef = useRef(null);
    const groupRef = useRef(null);
    const [groupWidth, setGroupWidth] = useState(0);
    const [visible, setVisible] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        const group = groupRef.current;
        if (!group || reducedMotion) return undefined;
        let active = true;
        const measure = () => {
            if (active) setGroupWidth(group.getBoundingClientRect().width);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(group);
        document.fonts.ready.then(measure);
        document.fonts.addEventListener('loadingdone', measure);
        return () => {
            active = false;
            observer.disconnect();
            document.fonts.removeEventListener('loadingdone', measure);
        };
    }, [items, reducedMotion]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport || reducedMotion) return undefined;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [items, reducedMotion]);

    if (!items?.length) return null;
    const stopped = paused || hovered || focused || !visible || !groupWidth;

    return (
        <div
            ref={viewportRef}
            id={id}
            data-marquee-viewport
            data-lenis-prevent={reducedMotion ? '' : undefined}
            className={cn('relative w-full focus-visible:outline-offset-[-3px]', reducedMotion ? 'overflow-x-auto' : 'overflow-hidden', className)}
            role="region"
            aria-label={label}
            tabIndex={0}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
            }}
        >
            <div
                data-marquee-track
                className="flex w-max items-center py-3 whitespace-nowrap"
                style={
                    reducedMotion
                        ? undefined
                        : {
                              animationName: 'marquee',
                              animationDuration: `${groupWidth / Math.max(1, speed)}s`,
                              animationTimingFunction: 'linear',
                              animationIterationCount: 'infinite',
                              animationDirection: reverse ? 'reverse' : 'normal',
                              animationPlayState: stopped ? 'paused' : 'running',
                              willChange: 'transform',
                          }
                }
            >
                {Array.from({ length: reducedMotion ? 1 : 2 }, (_, copy) => (
                    <ul
                        key={copy}
                        ref={copy === 0 ? groupRef : undefined}
                        data-marquee-group
                        aria-hidden={copy === 1 ? true : undefined}
                        className="m-0 flex min-w-screen shrink-0 list-none items-center justify-around gap-6 pr-6 sm:gap-8 sm:pr-8"
                    >
                        {items.map((item, index) => (
                            <li key={`${item}-${index}`} className="flex shrink-0 items-center gap-6 sm:gap-8">
                                <span data-marquee-item className="font-display text-lg leading-normal sm:text-xl">{item}</span>
                                <span aria-hidden="true" className="text-sm leading-normal opacity-50">
                                    {separator}
                                </span>
                            </li>
                        ))}
                    </ul>
                ))}
            </div>
        </div>
    );
};

export default Marquee;
