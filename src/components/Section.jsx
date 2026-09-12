import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import useSectionSurface from '../hooks/useSectionSurface';
import { cn } from '../utils/cn';
import Reveal from './Reveal';
import ArcHeading from './type/ArcHeading';
import AnimatedHeading from './type/AnimatedHeading';
import SystemBackdrop, { SystemEmblem } from './SystemBackdrop';

// Section shell. Owns rhythm and the heading block so spacing cannot drift.
//
// `tone` picks the surface. Evidence sections (skills, experience, work,
// credentials) stay on canvas or white and never receive decorative shapes —
// a reviewer should never have to read a metric through a blob. Identity
// sections may use amber or indigo.
const TONES = {
    canvas: 'bg-canvas text-ink',
    surface: 'bg-surface text-ink',
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
    titleMotion,
    intro,
    children,
    tone = 'canvas',
    bleed = false,
    curved = false,
    className,
    contentClassName,
    headerClassName,
    aside,
}) => {
    const sectionRef = useRef(null);
    const surface = useSectionSurface(sectionRef, curved);
    const titleId = `${id}-title`;
    const invert = tone === 'indigo' || tone === 'indigoDeep';
    const Label = titleMotion ? 'div' : Reveal;

    return (
        <motion.section
            ref={sectionRef}
            style={surface}
            data-section-surface={curved ? '' : undefined}
            id={id}
            aria-labelledby={titleId}
            className={cn(
                'relative scroll-mt-24',
                TONES[tone] ?? TONES.canvas,
                // Large rounded top corners plus a negative pull, so the
                // section lifts over the one above rather than butting against
                // it. This is the main reason the reference page flows.
                // z-10 keeps the overlap from clipping the previous section's
                // content or swallowing its clicks.
                curved && 'z-10 -mt-8 rounded-t-[2rem] sm:-mt-14 sm:rounded-t-[3.5rem]',
                className
            )}
        >
            <SystemBackdrop dark={invert} variant={id} />
            <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 md:py-32">
                <div className={cn(titleMotion ? 'max-w-none' : 'max-w-3xl', headerClassName)}>
                    {(eyebrow || index) && (
                        <Label className="mb-4 flex items-center gap-3">
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
                                    data-heading-label={titleMotion ? '' : undefined}
                                    className={cn(
                                        'label',
                                        invert ? 'text-amber' : 'text-pink-deep'
                                    )}
                                >
                                    {eyebrow}
                                </span>
                            )}
                        </Label>
                    )}

                    {titleMotion === 'arc' ? (
                        <ArcHeading id={titleId} text={title} className="font-display text-title" />
                    ) : titleMotion ? (
                        <AnimatedHeading
                            id={titleId}
                            text={title}
                            variant={titleMotion}
                            className="font-display text-title text-balance"
                        />
                    ) : (
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
                    )}

                    {intro && (
                        <div className="mt-5 flex items-center justify-between gap-8">
                            <Reveal
                                as="p"
                                delay={0.08}
                                className={cn(
                                    'max-w-2xl text-base leading-relaxed sm:text-lg',
                                    invert ? 'text-canvas/75' : 'text-muted'
                                )}
                            >
                                {intro}
                            </Reveal>
                            <SystemEmblem dark={invert} className="hidden lg:block" />
                        </div>
                    )}

                    {aside}
                </div>

                {!bleed && children && (
                    <div className={cn('mt-12 sm:mt-16', contentClassName)}>{children}</div>
                )}
            </div>

            {bleed && children && <div className={cn(contentClassName)}>{children}</div>}
        </motion.section>
    );
};

export default Section;
