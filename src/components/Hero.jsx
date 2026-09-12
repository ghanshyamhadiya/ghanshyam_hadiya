import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { ArrowDown, Download, MapPin } from 'lucide-react';
import Blob from './Blob';
import Button from './Button';
import DataCore from './DataCore';
import FloatingObjects from './FloatingObjects';
import { Annotation } from './Signature';
import { profile } from '../data';
import { EASE_GLIDE } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import { useIsDesktop, usePrefersReducedMotion } from '../hooks/useMediaQuery';
import useBooted, { useIntroComplete } from '../hooks/useBooted';
import useGlideProgress from '../hooks/useGlideProgress';

// Cards that drift around the portrait. Kept short: four is enough to feel
// alive, more starts competing with the name for attention.
const FLOATERS = [
    // Fixed rem offset, not a percentage: this card has to clear the model
    // card's "Architecture / 01" header at every breakpoint, and the header
    // sits a constant distance from the top edge.
    { label: 'AWS Glue', top: '-2.4rem', left: '-6%', rotate: -8, className: 'bg-surface text-ink' },
    { label: 'PySpark', top: '30%', right: '-10%', rotate: 7, className: 'bg-indigo text-canvas' },
    { label: 'Delta Lake', bottom: '22%', left: '-12%', rotate: 5, className: 'bg-pink text-ink' },
    { label: 'Oracle ODI', bottom: '4%', right: '-4%', rotate: -6, className: 'bg-ink text-canvas' },
];

const Hero = () => {
    const sectionRef = useRef(null);
    const isDesktop = useIsDesktop();
    const reducedMotion = usePrefersReducedMotion();

    // Entry animations hold until the intro curtain starts lifting, otherwise
    // the whole sequence plays behind it and the page looks already settled.
    const booted = useBooted();
    const introComplete = useIntroComplete();
    const instant = reducedMotion || introComplete;

    const { progress: scrollYProgress } = useGlideProgress(sectionRef, ['start start', 'end start']);

    const enableParallax = isDesktop && !reducedMotion;
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '6%']);

    const show = (delay, from = { opacity: 0, y: 16 }) => ({
        initial: instant ? false : from,
        animate: booted ? { opacity: 1, y: 0 } : from,
        transition: instant ? { duration: 0 } : { duration: 0.6, delay, ease: EASE_GLIDE },
    });

    return (
        <section
            id="home"
            ref={sectionRef}
            aria-label="Introduction"
            className="relative overflow-hidden bg-amber pb-16 pt-28 sm:pb-20 sm:pt-32"
        >
            {/* Layered organic shapes. Decorative only — no text sits on them. */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <Blob
                    variant={1}
                    color="#FFE9A8"
                    className="-left-[15%] top-[8%] h-[70vh] w-[70vh]"
                    duration={22}
                />
                <Blob
                    variant={2}
                    color="#FFDD7A"
                    className="-right-[10%] -top-[10%] h-[60vh] w-[60vh]"
                    duration={26}
                    delay={2}
                />
                <Blob
                    variant={3}
                    color="#FFE9A8"
                    className="-bottom-[25%] left-[20%] h-[55vh] w-[80vh]"
                    duration={30}
                    delay={4}
                    opacity={0.7}
                />
            </div>

            <motion.div
                data-hero-content=""
                style={enableParallax ? { y } : undefined}
                className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-8"
            >
                {/* Name block — 8 of 12 so the name, not the photo, is the
                    largest thing in the hero. */}
                <div className="lg:col-span-8">
                    <motion.span
                        {...show(0.24, { opacity: 0, y: 10 })}
                        className="font-hand block text-2xl text-indigo sm:text-3xl"
                    >
                        {profile.greeting}
                    </motion.span>

                    <h1 className="mt-1 font-display text-name text-ink" style={{ fontOpticalSizing: 'none', fontVariationSettings: '"opsz" 80' }}>
                        {profile.nameLines.map((line) => (
                            <span key={line} className="block pb-[0.06em]">
                                {/* The marker sits on the animated element, not
                                    the mask — scripts/audit-intro.mjs reads its
                                    transform to prove the hero is still moving
                                    when the curtain clears. */}
                                <span
                                    data-hero-line
                                    data-hero-name-target
                                    style={{ opacity: introComplete ? 1 : 0 }}
                                    className="inline-block"
                                >
                                    {line}
                                </span>
                            </span>
                        ))}
                    </h1>

                    <motion.div
                        {...show(0.62)}
                        className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2"
                    >
                        <span className="rounded-full bg-ink px-4 py-1.5 font-display text-sm font-semibold text-canvas sm:text-base">
                            {profile.role}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[0.75rem] text-muted">
                            <MapPin size={13} aria-hidden="true" />
                            {profile.location}
                        </span>
                    </motion.div>

                    <motion.p
                        {...show(0.72)}
                        data-hero-intro
                        className="mt-6 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg"
                    >
                        {profile.intro}
                    </motion.p>

                    <motion.div {...show(0.82)} className="mt-8 flex flex-wrap items-center gap-3">
                        <Button
                            as="a"
                            href={profile.cta.href}
                            variant="pink"
                            size="lg"
                            data-cursor="see the work"
                            onClick={(event) => {
                                event.preventDefault();
                                scrollToSection(profile.cta.href.replace('#', ''));
                            }}
                            icon={<ArrowDown size={16} />}
                        >
                            {profile.cta.label}
                        </Button>

                        <Button
                            as="a"
                            href={profile.resume.href}
                            download
                            variant="outline"
                            size="lg"
                            data-cursor="download"
                            icon={<Download size={16} />}
                        >
                            {profile.resume.label}
                        </Button>
                    </motion.div>
                </div>

                {/* Portrait */}
                <motion.div
                    initial={instant ? false : { opacity: 0, scale: 0.94, y: 24 }}
                    animate={
                        booted ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.94, y: 24 }
                    }
                    transition={instant ? { duration: 0 } : { duration: 1, delay: 0.18, ease: EASE_GLIDE }}
                    className="relative lg:col-span-4"
                >
                    <div className="relative mx-auto w-full max-w-[380px] md:w-full">
                        {/* Colour block behind the photo, offset for depth. */}
                        <span
                            aria-hidden="true"
                            className="absolute -bottom-3 -right-3 h-full w-full rounded-[2rem] bg-indigo sm:-bottom-4 sm:-right-4"
                        />
                        <DataCore />

                        <FloatingObjects items={FLOATERS} className="bottom-auto hidden h-2/3 sm:block" />
                    </div>

                    {/* Sits below the frame rather than over it — anchored to
                        the image it was half-hidden behind the photo. */}
                    <Annotation className="mt-6 block text-center text-indigo md:mt-7" rotate={-5}>
                        built to connect
                    </Annotation>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default Hero;
