import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

// The single owner of section rhythm and the editorial two-column header:
// a mono eyebrow pinned in the narrow left column, serif title and copy on the
// right. Every section goes through here so spacing can never drift again.
//
// `bleed` renders children full-width below the header instead of inside the
// 9-column content track — used by the project card stack.
const Section = ({
    id,
    eyebrow,
    title,
    intro,
    children,
    bleed = false,
    bordered = true,
    className,
    contentClassName,
}) => {
    const titleId = `${id}-title`;

    return (
        <section
            id={id}
            aria-labelledby={titleId}
            className={cn(
                'scroll-mt-28 py-24 sm:py-32 md:py-40',
                bordered && 'border-t border-line',
                className
            )}
        >
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
                <div className="grid gap-y-6 md:grid-cols-12 md:gap-x-10">
                    {eyebrow && (
                        <div className="md:col-span-3">
                            <motion.p
                                initial={{ opacity: 0, x: -8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={viewport}
                                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                                className="label text-accent md:sticky md:top-32"
                            >
                                {eyebrow}
                            </motion.p>
                        </div>
                    )}

                    <div className={cn(eyebrow ? 'md:col-span-9' : 'md:col-span-12')}>
                        <span className="block overflow-hidden pb-1">
                            <motion.h2
                                id={titleId}
                                initial={{ y: '110%' }}
                                whileInView={{ y: '0%' }}
                                viewport={viewport}
                                transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                                className="font-display text-title leading-[1.05] text-ink"
                            >
                                {title}
                            </motion.h2>
                        </span>

                        {intro && (
                            <motion.p
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={viewport}
                                transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT_EXPO }}
                                className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
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

            {bleed && children && (
                <div className={cn('mt-12 sm:mt-16', contentClassName)}>{children}</div>
            )}
        </section>
    );
};

export default Section;
