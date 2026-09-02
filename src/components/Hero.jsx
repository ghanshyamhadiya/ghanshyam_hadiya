import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown } from 'lucide-react';
import Magnetic from './Magnetic';
import { profile } from '../data';
import { EASE_OUT_EXPO } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import { useIsDesktop, usePrefersReducedMotion } from '../hooks/useMediaQuery';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
    const textContainerRef = useRef(null);
    const isDesktop = useIsDesktop();
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        const element = textContainerRef.current;
        if (!element || !isDesktop || reducedMotion) return undefined;

        const ctx = gsap.context(() => {
            gsap.to(element, {
                scrollTrigger: {
                    trigger: '#home',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1,
                },
                y: 220,
                scale: 0.65,
                opacity: 0,
                transformOrigin: 'center top',
                ease: 'none',
            });
        });

        return () => ctx.revert();
    }, [isDesktop, reducedMotion]);

    // Flatten the headline into words with a running delay so both lines
    // cascade as one continuous animation.
    const headlineLines = useMemo(() => {
        const lines = profile.headline.map((line) => line.split(' '));
        return lines.map((words, lineIndex) => {
            // Number of words rendered before this line, so delays keep counting up.
            const offset = lines
                .slice(0, lineIndex)
                .reduce((total, previous) => total + previous.length, 0);

            return words.map((word, index) => ({
                word,
                key: `${lineIndex}-${index}-${word}`,
                delay: 0.5 + (offset + index) * 0.09,
            }));
        });
    }, []);

    return (
        <section
            id="home"
            className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-[#050505] px-5 sm:px-8 md:px-12 pb-16 pt-32 sm:pt-36 md:pt-40 text-white"
        >
            <div className="relative z-10 mx-auto w-full max-w-7xl">
                <div className="mb-6 overflow-hidden">
                    <motion.span
                        initial={{ y: '110%' }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.9, delay: 0.3, ease: EASE_OUT_EXPO }}
                        className="block text-[0.7rem] sm:text-sm md:text-base font-bold uppercase tracking-[0.28em] text-white/70"
                    >
                        {profile.role}
                    </motion.span>
                </div>

                <div ref={textContainerRef} className="relative z-10 will-change-transform">
                    <h1 className="flex flex-col text-[3.1rem] leading-[0.88] sm:text-7xl md:text-8xl lg:text-[9rem] xl:text-[10rem] font-black uppercase tracking-tighter">
                        {headlineLines.map((words, lineIndex) => (
                            <span
                                key={lineIndex}
                                className="flex flex-wrap gap-x-3 gap-y-1 overflow-hidden md:gap-x-5"
                            >
                                {words.map(({ word, delay, key }) => (
                                    <motion.span
                                        key={key}
                                        initial={{ y: '110%' }}
                                        animate={{ y: 0 }}
                                        transition={{ duration: 1, delay, ease: EASE_OUT_EXPO }}
                                        className="inline-block"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 1.4, ease: EASE_OUT_EXPO }}
                    className="mt-12 flex flex-col gap-8 md:mt-16 md:flex-row md:items-end md:justify-between"
                >
                    <p className="max-w-xl text-base sm:text-lg md:text-xl font-medium leading-relaxed text-gray-300">
                        {profile.intro}
                    </p>

                    <Magnetic>
                        <a
                            href="#projects"
                            onClick={(event) => {
                                event.preventDefault();
                                scrollToSection('projects');
                            }}
                            className="group inline-flex w-max items-center gap-3 rounded-full border border-white bg-white px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors duration-300 hover:bg-transparent hover:text-white"
                        >
                            Explore Work
                            <ArrowDown
                                size={16}
                                className="transition-transform duration-300 group-hover:translate-y-1"
                            />
                        </a>
                    </Magnetic>
                </motion.div>
            </div>

            {/* Scroll hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2 }}
                className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
            >
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/40">
                    Scroll
                </span>
                <span className="h-12 w-px overflow-hidden bg-white/15">
                    <motion.span
                        animate={{ y: ['-100%', '100%'] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        className="block h-full w-px bg-white/80"
                    />
                </span>
            </motion.div>

            <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.5, delay: 1, ease: EASE_OUT_EXPO }}
                className="absolute top-0 right-12 hidden h-full w-px origin-top bg-white/10 md:block md:right-32"
                aria-hidden="true"
            />
        </section>
    );
};

export default Hero;
