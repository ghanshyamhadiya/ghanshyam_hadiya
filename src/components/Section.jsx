import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { cn } from '../utils/cn';
import useGlideProgress from '../hooks/useGlideProgress';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useMotionPreset } from '../hooks/useMotionPreview';
import { useBackgroundPreset } from '../hooks/useBackgroundPreview';
import BackgroundArt from './BackgroundArt';
import { SECTION_GLIDE, getSectionPose } from '../utils/sectionMotion';

// Section shell. Owns rhythm and the heading block so spacing cannot drift.
//
// `tone` picks the surface. Evidence sections (skills, experience, work,
// credentials) stay on canvas or white and never receive decorative shapes —
// a reviewer should never have to read a metric through a blob. Identity
// sections may use amber or indigo.
const TONES = {
    canvas: 'bg-canvas text-ink',
    surface: 'bg-canvas text-ink',
    soft: 'bg-canvas text-ink',
    amber: 'bg-canvas text-ink',
    indigo: 'bg-indigo text-canvas',
    indigoDeep: 'bg-indigo-deep text-canvas',
};

const Section = ({
    id,
    index,
    eyebrow,
    title,
    titleLines,
    intro,
    children,
    tone = 'canvas',
    curved = false,
    className,
    contentClassName,
    headerClassName,
    aside,
}) => {
    const trackRef = useRef(null);
    const desktop = useMediaQuery('(min-width: 768px)');
    const shortViewport = useMediaQuery('(max-height: 600px)');
    const { progress, reducedMotion } = useGlideProgress(trackRef, desktop ? ['start 112px', 'end 112px'] : ['start 88px', 'end 88px'], SECTION_GLIDE);
    const still = reducedMotion || shortViewport;
    const preset = useMotionPreset();
    const background = useBackgroundPreset();
    const scene = useTransform(progress, (value) => {
        const t = Math.max(0, Math.min(1, value));
        return t * t * (3 - 2 * t);
    });
    const headingTransform = useTransform(scene, (value) => getSectionPose(preset, value, desktop).heading);
    const headingClip = useTransform(scene, (value) => getSectionPose(preset, value, desktop).clip);
    const contentTransform = useTransform(scene, (value) => getSectionPose(preset, value, desktop).content);
    const contentOpacity = useTransform(scene, (value) => getSectionPose(preset, value, desktop).opacity);
    const ruleScale = useTransform(scene, (value) => getSectionPose(preset, value, desktop).rule);
    const lines = titleLines?.join(' ') === title ? titleLines : [title];
    const titleId = `${id}-title`;
    const invert = tone === 'indigo' || tone === 'indigoDeep';

    return (
        <section
            data-section-surface={curved ? '' : undefined}
            id={id}
            aria-labelledby={titleId}
            data-cinematic-section={id}
            data-scene-motion={still ? 'static' : 'cinematic'}
            data-motion-preset={preset}
            data-background-preset={background}
            className={cn(
                'cinematic-section background-surface relative scroll-mt-24',
                TONES[tone] ?? TONES.canvas,
                // Large rounded top corners plus a negative pull, so the
                // section lifts over the one above rather than butting against
                // it. This is the main reason the reference page flows.
                // z-10 keeps the overlap from clipping the previous section's
                // content or swallowing its clicks.
                className
            )}
        >
            <BackgroundArt preset={background} progress={scene} still={still} inverted={invert} alternate={Number(index) % 2 === 1} />
            <div className="relative z-[1] mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
                <div data-scene-lead className={cn('cinematic-lead', headerClassName)}>
                    <div ref={trackRef} data-scene-track className="cinematic-track" aria-hidden="true" />
                    <div data-scene-pin className="cinematic-pin">
                        <motion.span
                            data-scene-rule
                            aria-hidden="true"
                            className={cn('mb-6 block h-px origin-left', invert ? 'bg-line-invert' : 'bg-line-strong')}
                            style={still ? undefined : { scaleX: ruleScale, transformOrigin: preset === 'lateral' ? '100% 50%' : preset === 'curtain' ? '50% 50%' : '0% 50%' }}
                        />
                        <div className={cn('mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.16em]', invert ? 'text-canvas/70' : 'text-subtle')}>
                            {index && <span>{index}</span>}
                            {eyebrow && <span>{eyebrow}</span>}
                        </div>
                        <motion.h2
                            id={titleId}
                            data-cinematic-heading
                            className="cinematic-title"
                            style={still ? undefined : { transform: headingTransform, clipPath: headingClip, transformOrigin: preset === 'depth' ? '50% 50%' : '0% 0%' }}
                        >
                            <span className="sr-only">{title}</span>
                            <span aria-hidden="true">
                                {lines.map((line, i) => (
                                    <span data-scene-line key={`${line}-${i}`} className="block">{line}</span>
                                ))}
                            </span>
                        </motion.h2>
                    </div>
                    <div data-scene-runway className="cinematic-runway" aria-hidden="true" />
                </div>

                <motion.div
                    data-scene-content
                    className={cn('relative', contentClassName)}
                    style={still ? undefined : { transform: contentTransform, opacity: contentOpacity }}
                >
                    {intro && (
                        <p data-scene-intro className={cn('max-w-2xl text-base leading-relaxed sm:text-lg', invert ? 'text-canvas/75' : 'text-muted')}>
                            {intro}
                        </p>
                    )}
                    {aside}
                    {intro ? <div className="mt-10 md:mt-12">{children}</div> : children}
                </motion.div>
            </div>
        </section>
    );
};

export default Section;
