import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SectionHeading from './SectionHeading';
import AnimatedText from './AnimatedText';
import Reveal from './Reveal';
import { profile } from '../data';
import { useIsDesktop } from '../hooks/useMediaQuery';

const About = () => {
    const ref = useRef(null);
    const isDesktop = useIsDesktop();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    // Background marquee drifts as you scroll (desktop only — it hurts on mobile).
    const marqueeX = useTransform(scrollYProgress, [0, 1], ['5%', '-35%']);

    return (
        <section
            id="about"
            ref={ref}
            className="relative scroll-mt-28 overflow-hidden px-5 sm:px-8 md:px-12 py-20 sm:py-28 md:py-32"
        >
            {isDesktop && (
                <motion.div
                    style={{ x: marqueeX }}
                    className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 whitespace-nowrap text-[14vw] font-black uppercase tracking-tighter text-white/[0.035] select-none"
                    aria-hidden="true"
                >
                    {profile.marquee} {profile.marquee}
                </motion.div>
            )}

            <div className="relative z-10 mx-auto grid max-w-7xl gap-12 md:grid-cols-12 md:gap-16">
                <div className="md:col-span-5">
                    <SectionHeading eyebrow="Who I Am" title="About Me" />

                    <Reveal
                        delay={0.15}
                        className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 backdrop-blur-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-white/70">
                            {profile.availability}
                        </span>
                    </Reveal>
                </div>

                <div className="md:col-span-7 space-y-6">
                    {profile.about.map((paragraph, index) => (
                        <AnimatedText
                            key={index}
                            text={paragraph}
                            delay={index * 0.12}
                            className="text-base sm:text-lg md:text-xl font-medium leading-relaxed text-gray-300"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default About;
