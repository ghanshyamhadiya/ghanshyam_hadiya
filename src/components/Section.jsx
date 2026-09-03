import React from 'react';
import { cn } from '../utils/cn';
import Reveal from './Reveal';
import ScrambleText from './ScrambleText';

// Owns section rhythm and the technical header: a mono index and eyebrow in the
// narrow left column, a grotesk title on the right, hairline rules between
// sections. Every section goes through here so spacing can never drift.
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
            className={cn('relative scroll-mt-24 border-t border-line', className)}
        >
            <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24 md:py-32">
                <div className="grid gap-y-6 md:grid-cols-12 md:gap-x-10">
                    <div className="md:col-span-3">
                        <Reveal className="flex items-baseline gap-3 md:sticky md:top-28 md:flex-col md:gap-2">
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
                        </Reveal>
                    </div>

                    <div className="md:col-span-9">
                        {/* Masked wipe rather than a fade, to suit the hard edges. */}
                        <span className="block overflow-hidden pb-[0.08em]">
                            <Reveal
                                as="h2"
                                id={titleId}
                                variant="mask"
                                duration={0.7}
                                className="font-display text-title leading-[0.95] text-balance text-ink"
                            >
                                {title}
                            </Reveal>
                        </span>

                        {intro && (
                            <Reveal
                                as="p"
                                delay={0.08}
                                className="mt-5 max-w-2xl border-l border-accent/40 pl-4 text-sm leading-relaxed text-muted sm:text-base"
                            >
                                {intro}
                            </Reveal>
                        )}

                        {!bleed && children && (
                            <div className={cn('mt-10 sm:mt-14', contentClassName)}>{children}</div>
                        )}
                    </div>
                </div>
            </div>

            {bleed && children && <div className={cn(contentClassName)}>{children}</div>}
        </section>
    );
};

export default Section;
