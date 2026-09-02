import React, { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, Download, MapPin } from 'lucide-react';
import Magnetic from './Magnetic';
import { profile } from '../data';
import { EASE_OUT_EXPO } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import { useIsDesktop, usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Faint data-flow motif. Three hairlines with travelling accent dots, reusing
// the flow-right keyframes from index.css. Deliberately near-invisible — it
// should register as texture, not decoration.
const Backdrop = ({ reducedMotion }) => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
                backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
                backgroundSize: '44px 44px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
                WebkitMaskImage:
                    'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
            }}
        />

        {[28, 54, 76].map((top, index) => (
            <span
                key={top}
                className="absolute left-0 h-px w-full bg-line"
                style={{ top: `${top}%` }}
            >
                {!reducedMotion && (
                    <span
                        className="absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-accent/70 animate-[flow-right_7s_linear_infinite]"
                        style={{ animationDelay: `${index * 2.4}s` }}
                    />
                )}
            </span>
        ))}
    </div>
);

const Hero = () => {
    const sectionRef = useRef(null);
    const isDesktop = useIsDesktop();
    const reducedMotion = usePrefersReducedMotion();

    // Replaces the previous GSAP ScrollTrigger parallax. framer-motion was
    // already a dependency, so GSAP existed purely for this one effect.
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start'],
    });

    const enableParallax = isDesktop && !reducedMotion;
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
    const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

    // Flatten the headline so the two clauses cascade as one animation.
    const words = useMemo(
        () => [
            ...profile.headline.lead.split(' ').map((word) => ({ word, emphasis: false })),
            ...profile.headline.emphasis.split(' ').map((word) => ({ word, emphasis: true })),
        ],
        []
    );

    return (
        <section
            id="home"
            ref={sectionRef}
            aria-label="Introduction"
            className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-5 pb-16 pt-32 sm:px-8 sm:pt-36 md:pt-40"
        >
            <Backdrop reducedMotion={reducedMotion} />

            <motion.div
                style={enableParallax ? { y, opacity } : undefined}
                className="relative z-10 mx-auto w-full max-w-6xl"
            >
                {/* Meta line */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT_EXPO }}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2"
                >
                    <span className="label text-accent">{profile.role}</span>
                    <span className="hidden h-3 w-px bg-line-strong sm:block" aria-hidden="true" />
                    <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-subtle">
                        <MapPin size={12} aria-hidden="true" />
                        {profile.location}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-[0.7rem] text-subtle">
                        <span className="relative flex h-1.5 w-1.5">
                            {!reducedMotion && (
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                            )}
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </span>
                        {profile.availability}
                    </span>
                </motion.div>

                {/* Headline — serif, sentence case, emphasis in italic copper. */}
                <h1 className="mt-8 max-w-4xl font-display text-display leading-[0.95] text-ink">
                    <span className="flex flex-wrap gap-x-[0.28em]">
                        {words.map(({ word, emphasis }, index) => (
                            <span key={`${word}-${index}`} className="overflow-hidden pb-[0.06em]">
                                <motion.span
                                    initial={{ y: '110%' }}
                                    animate={{ y: 0 }}
                                    transition={{
                                        duration: 0.9,
                                        delay: 0.3 + index * 0.07,
                                        ease: EASE_OUT_EXPO,
                                    }}
                                    className={
                                        emphasis ? 'inline-block italic text-accent' : 'inline-block'
                                    }
                                >
                                    {word}
                                </motion.span>
                            </span>
                        ))}
                    </span>
                </h1>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9, ease: EASE_OUT_EXPO }}
                    className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end md:gap-10"
                >
                    <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg md:col-span-7">
                        {profile.intro}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 md:col-span-5 md:justify-end">
                        <Magnetic>
                            <a
                                href={profile.cta.href}
                                onClick={(event) => {
                                    event.preventDefault();
                                    scrollToSection(profile.cta.href.replace('#', ''));
                                }}
                                className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-bg transition-colors duration-300 hover:bg-accent-hi"
                            >
                                {profile.cta.label}
                                <ArrowDown
                                    size={14}
                                    className="transition-transform duration-300 group-hover:translate-y-0.5"
                                />
                            </a>
                        </Magnetic>

                        <a
                            href={profile.resume.href}
                            download
                            className="group inline-flex items-center gap-2.5 rounded-full border border-line-strong px-6 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted transition-colors duration-300 hover:border-accent/50 hover:text-accent"
                        >
                            <Download size={14} />
                            {profile.resume.label}
                        </a>
                    </div>
                </motion.div>
            </motion.div>

            {/* Scroll hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.6 }}
                className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
            >
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-subtle">
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
