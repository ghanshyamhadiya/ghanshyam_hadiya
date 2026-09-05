import React from 'react';
import { cn } from '../utils/cn';
import Reveal from './Reveal';

// Section shell. Owns rhythm and the heading block so spacing cannot drift.
//
// `tone` picks the surface. Evidence sections (skills, experience, work,
// credentials) stay on canvas or white and never receive decorative shapes —
// a reviewer should never have to read a metric through a blob. Identity
// sections may use amber or indigo.
const TONES = {
    canvas: 'bg-canvas text-ink',
    soft: 'bg-amber-soft text-ink',
    amber: 'bg-amber text-ink',
    indigo: 'bg-indigo text-canvas',
    indigoDeep: 'bg-indigo-deep text-canvas',
};

const Section = ({
    id,
    index,
    eyebrow,
    title,
    intro,
    children,
    tone = 'canvas',
    bleed = false,
    className,
    contentClassName,
    headerClassName,
    aside,
}) => {
    const titleId = `${id}-title`;
    const invert = tone === 'indigo' || tone === 'indigoDeep';

    return (
        <section
            id={id}
            aria-labelledby={titleId}
            className={cn('relative scroll-mt-24', TONES[tone] ?? TONES.canvas, className)}
        >
            <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 md:py-32">
                <div className={cn('max-w-3xl', headerClassName)}>
                    {(eyebrow || index) && (
                        <Reveal className="mb-4 flex items-center gap-3">
                            {index && (
                                <span
                                    className={cn(
                                        'flex h-7 w-7 items-center justify-center rounded-full font-mono text-[0.65rem] font-medium',
                                        invert ? 'bg-canvas/15 text-canvas' : 'bg-ink text-canvas'
                                    )}
                                >
                                    {index}
                                </span>
                            )}
                            {eyebrow && (
                                <span
                                    className={cn(
                                        'label',
                                        invert ? 'text-amber' : 'text-pink-deep'
                                    )}
                                >
                                    {eyebrow}
                                </span>
                            )}
                        </Reveal>
                    )}

                    <span className="block overflow-hidden pb-[0.08em]">
                        <Reveal
                            as="h2"
                            id={titleId}
                            variant="mask"
                            duration={0.7}
                            className="font-display text-title text-balance"
                        >
                            {title}
                        </Reveal>
                    </span>

                    {intro && (
                        <Reveal
                            as="p"
                            delay={0.08}
                            className={cn(
                                'mt-5 max-w-2xl text-base leading-relaxed sm:text-lg',
                                invert ? 'text-canvas/75' : 'text-muted'
                            )}
                        >
                            {intro}
                        </Reveal>
                    )}

                    {aside}
                </div>

                {!bleed && children && (
                    <div className={cn('mt-12 sm:mt-16', contentClassName)}>{children}</div>
                )}
            </div>

            {bleed && children && <div className={cn(contentClassName)}>{children}</div>}
        </section>
    );
};

export default Section;
