import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Download } from 'lucide-react';
import Button from './Button';
import { profile } from '../data';
import { EASE_GLIDE } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import useGlideProgress from '../hooks/useGlideProgress';
import useBooted, { useIntroComplete } from '../hooks/useBooted';
import { useBackgroundPreset } from '../hooks/useBackgroundPreview';
import { useMediaQuery } from '../hooks/useMediaQuery';
import BackgroundArt from './BackgroundArt';

const DataHero = () => {
    const ref = useRef(null);
    const { progress, reducedMotion } = useGlideProgress(ref, ['start start', 'end start']);
    const nameX = useTransform(progress, [0, 1], ['0%', '-8%']);
    const arrowRotate = useTransform(progress, [0, 1], [0, 45]);
    const booted = useBooted();
    const introComplete = useIntroComplete();
    const background = useBackgroundPreset();
    const shortViewport = useMediaQuery('(max-height: 600px)');
    const instant = reducedMotion || introComplete;

    const show = (delay, from = { opacity: 0, y: 16 }) => ({
        initial: instant ? false : from,
        animate: booted ? { opacity: 1, y: 0 } : from,
        transition: instant ? { duration: 0 } : { duration: 0.6, delay, ease: EASE_GLIDE },
    });

    return (
        <section ref={ref} id="home" aria-label="Introduction" data-editorial-hero data-background-preset={background} className="editorial-hero background-surface bg-canvas text-ink">
            <BackgroundArt preset={background} progress={progress} still={reducedMotion || shortViewport} />
            <div className="relative z-[1] mx-auto w-full max-w-6xl px-5 sm:px-8" data-hero-content>
                <motion.div {...show(0.05)} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-line pb-4">
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-subtle">
                        {profile.role} / {profile.location}
                    </span>
                    <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.08em] text-muted">
                        <span className="h-2 w-2 rounded-full bg-pink-deep" aria-hidden="true" />
                        {profile.availability}
                    </span>
                </motion.div>

                <h1 className="editorial-name mt-8 font-display">
                    <span className="editorial-name-row">
                        <span
                            data-hero-line
                            data-hero-name-target
                            style={{ opacity: introComplete ? 1 : 0 }}
                            className="inline-block"
                        >
                            {profile.nameLines[0]}
                        </span>
                    </span>
                    <motion.span
                        data-editorial-drift
                        className="editorial-name-row editorial-name-row--end text-pink-deep"
                        style={reducedMotion ? undefined : { x: nameX }}
                    >
                        <motion.span aria-hidden="true" className="inline-flex" style={reducedMotion ? undefined : { rotate: arrowRotate }}>
                            <ArrowDownRight className="editorial-name-arrow" strokeWidth={1} />
                        </motion.span>
                        <span
                            data-hero-line
                            data-hero-name-target
                            style={{ opacity: introComplete ? 1 : 0 }}
                            className="inline-block"
                        >
                            {profile.nameLines[1]}
                        </span>
                    </motion.span>
                </h1>

                <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
                    <motion.div {...show(0.12)}>
                        <p className="font-display text-[22px] leading-[1.25]">
                            {profile.headline.lead}{' '}
                            <em className="not-italic text-pink-deep">{profile.headline.emphasis}</em>
                        </p>
                        <p data-hero-intro className="mt-4 max-w-[600px] text-[15px] leading-[1.7] text-muted">
                            {profile.intro}
                        </p>
                    </motion.div>
                    <motion.div {...show(0.22)} className="flex flex-wrap gap-3 lg:justify-end">
                        <Button
                            as="a"
                            href={profile.cta.href}
                            variant="ink"
                            size="lg"
                            onClick={(event) => {
                                event.preventDefault();
                                scrollToSection(profile.cta.href.replace('#', ''));
                            }}
                            icon={<ArrowUpRight size={16} />}
                        >
                            {profile.cta.label}
                        </Button>
                        <Button
                            as="a"
                            href={profile.resume.href}
                            download
                            variant="outline"
                            size="lg"
                            icon={<Download size={16} />}
                        >
                            {profile.resume.label}
                        </Button>
                    </motion.div>
                </div>

                <motion.div {...show(0.22)} className="mt-8 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.13em] text-subtle">
                    <span>AWS Glue / PySpark / Python</span>
                    <a
                        href="#about"
                        onClick={(event) => { event.preventDefault(); scrollToSection('about'); }}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-pink-deep"
                    >
                        Scroll to explore
                        <ArrowDownRight size={13} aria-hidden="true" />
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default DataHero;
