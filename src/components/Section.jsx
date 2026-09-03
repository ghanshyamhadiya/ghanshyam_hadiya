import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';
import ScrambleText from './ScrambleText';

// Owns section rhythm and the technical header: a mono index and eyebrow in the
// narrow left column, a grotesk title on the right, hairline rules top and
// bottom. Every section goes through here so spacing can never drift.
//
// `bleed` renders children full-width below the header instead of inside the
// content track — used by the project card stack.
const Section = ({
    id,
    index,
    eyebrow,
    title,
    intro,
    children,
    bleed = false,
    className,
    contentClassName,
}) => {
    const titleId = `${id}-title`;

    return (
        <section
            id={id}
            aria-labelledby={titleId}
            className={cn('relative scroll-mt-28 border-t border-line', className)}
        >
            <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 md:py-36">
                <div className="grid gap-y-8 md:grid-cols-12 md:gap-x-10">
                    <div className="md:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={viewport}
                            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                            className="flex items-baseline gap-3 md:sticky md:top-32 md:flex-col md:gap-2"
                        >
                            {index && (
                                <span className="font-mono text-[0.65rem] tracking-[0.2em] text-subtle tabular-nums">
                                    [{index}]
                                </span>
                            )}
                            {eyebrow && (
                                <ScrambleText
                                    text={eyebrow}
                                    className="label block text-accent"
                                    rescanOnHover
                                />
                            )}
                        </motion.div>
                    </div>

                    <div className="md:col-span-9">
                        {/* Clip-path wipe: the heading is uncovered rather than
                            faded, which suits the hard-edged language. */}
                        <motion.h2
                            id={titleId}
                            initial={{ clipPath: 'inset(0 100% 0 0)' }}
                            whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
                            viewport={viewport}
                            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                            className="font-display text-title leading-[0.92] text-ink"
                        >
                            {title}
                        </motion.h2>

                        {intro && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={viewport}
                                transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT_EXPO }}
                                className="mt-6 max-w-2xl border-l border-accent/40 pl-4 text-sm leading-relaxed text-muted sm:text-base"
                            >
                                {intro}
                            </motion.p>
                        )}

                        {!bleed && children && (
                            <div className={cn('mt-12 sm:mt-16', contentClassName)}>{children}</div>
                        )}
                    </div>
                </div>
            </div>

            {bleed && children && <div className={cn(contentClassName)}>{children}</div>}
        </section>
    );
};

export default Section;
