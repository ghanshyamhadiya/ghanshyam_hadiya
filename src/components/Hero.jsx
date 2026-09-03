import React, { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, Download } from 'lucide-react';
import Magnetic from './Magnetic';
import ScrambleText from './ScrambleText';
import { profile } from '../data';
import { EASE_OUT_EXPO } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import { useIsDesktop, usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Structural backdrop: blueprint grid plus four full-height column rules, so
// the page reads as being built on a visible grid rather than floating.
const Backdrop = ({ reducedMotion }) => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
            className="grid-bg absolute inset-0"
            style={{
                maskImage: 'radial-gradient(ellipse 80% 65% at 50% 45%, black, transparent)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 65% at 50% 45%, black, transparent)',
            }}
        />

        <div className="mx-auto flex h-full max-w-6xl justify-between px-5 sm:px-8">
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 1.1, delay: 0.2 + i * 0.07, ease: EASE_OUT_EXPO }}
                    className="h-full w-px origin-top bg-line"
                />
            ))}
        </div>

        {!reducedMotion &&
            [30, 62].map((top, index) => (
                <span key={top} className="absolute left-0 h-px w-full bg-line" style={{ top: `${top}%` }}>
                    <span
                        className="absolute top-1/2 h-1 w-6 -translate-y-1/2 bg-accent/60 animate-[flow-right_9s_linear_infinite]"
                        style={{ animationDelay: `${index * 3.5}s` }}
                    />
                </span>
            ))}
    </div>
);

const Hero = () => {
    const sectionRef = useRef(null);
    const isDesktop = useIsDesktop();
    const reducedMotion = usePrefersReducedMotion();

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start'],
    });

    const enableParallax = isDesktop && !reducedMotion;
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    const lines = useMemo(
        () => [profile.headline.lead, profile.headline.emphasis],
        []
    );

    return (
        <section
            id="home"
            ref={sectionRef}
            aria-label="Introduction"
            className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-5 pb-16 pt-32 sm:px-8 sm:pt-36"
        >
            <Backdrop reducedMotion={reducedMotion} />

            <motion.div
                style={enableParallax ? { y, opacity } : undefined}
                className="relative z-10 mx-auto w-full max-w-6xl"
            >
                {/* Status bar */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT_EXPO }}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line py-2.5"
                >
                    <ScrambleText text={profile.role} className="label text-accent" />
                    <span className="hidden h-3 w-px bg-line-strong sm:block" aria-hidden="true" />
                    <span className="font-mono text-[0.68rem] text-subtle">{profile.location}</span>
                    <span className="ml-auto flex items-center gap-2 font-mono text-[0.68rem] text-subtle">
                        <span className="h-1.5 w-1.5 bg-emerald-400" aria-hidden="true" />
                        {profile.availability}
                    </span>
                </motion.div>

                {/* Headline — each line wipes in from behind a mask */}
                <h1 className="mt-8 font-display text-display leading-[0.85] text-ink">
                    {lines.map((line, i) => (
                        <span key={line} className="block overflow-hidden">
                            <motion.span
                                initial={{ y: '105%' }}
                                animate={{ y: 0 }}
                                transition={{
                                    duration: 1,
                                    delay: 0.35 + i * 0.12,
                                    ease: EASE_OUT_EXPO,
                                }}
                                className={i === 1 ? 'block text-accent' : 'block'}
                            >
                                {line}
                            </motion.span>
                        </span>
                    ))}
                </h1>

                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.85, ease: EASE_OUT_EXPO }}
                    className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-12 md:items-start md:gap-10"
                >
                    <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base md:col-span-7">
                        {profile.intro}
                        <span
                            className="ml-1 inline-block h-4 w-2 translate-y-0.5 bg-accent animate-[blink_1.1s_step-end_infinite]"
                            aria-hidden="true"
                        />
                    </p>

                    <div className="flex flex-wrap items-center gap-0 md:col-span-5 md:justify-end">
                        <Magnetic>
                            <a
                                href={profile.cta.href}
                                data-cursor="view work"
                                onClick={(event) => {
                                    event.preventDefault();
                                    scrollToSection(profile.cta.href.replace('#', ''));
                                }}
                                className="group relative inline-flex items-center gap-3 overflow-hidden border border-accent px-6 py-3.5 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-accent transition-colors duration-300 hover:text-bg"
                            >
                                <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
                                <span className="relative">{profile.cta.label}</span>
                                <ArrowDown
                                    size={14}
                                    className="relative transition-transform duration-300 group-hover:translate-y-0.5"
                                />
                            </a>
                        </Magnetic>

                        <a
                            href={profile.resume.href}
                            download
                            data-cursor="download"
                            className="group relative inline-flex items-center gap-3 overflow-hidden border border-line-strong border-l-0 px-6 py-3.5 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-muted transition-colors duration-300 hover:text-ink"
                        >
                            <span className="absolute inset-0 -translate-x-full bg-surface-2 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
                            <Download size={14} className="relative" />
                            <span className="relative">{profile.resume.label}</span>
                        </a>
                    </div>
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.5 }}
                className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
            >
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.3em] text-subtle">
                    Scroll
                </span>
                <span className="h-10 w-px overflow-hidden bg-line-strong">
                    {!reducedMotion && (
                        <motion.span
                            animate={{ y: ['-100%', '100%'] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            className="block h-full w-px bg-accent"
                        />
                    )}
                </span>
            </motion.div>
        </section>
    );
};

export default Hero;
