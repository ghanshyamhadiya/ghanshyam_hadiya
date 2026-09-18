import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Download, MapPin } from 'lucide-react';
import Button from './Button';
import { Annotation } from './Signature';
import { useWorld } from '../hooks/useWorld';
import { profile } from '../data';
import { EASE_GLIDE } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import useBooted, { useIntroComplete } from '../hooks/useBooted';
import useGlideProgress from '../hooks/useGlideProgress';

const Hero = () => {
    const sectionRef = useRef(null);
    const slotRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    const world = useWorld();

    // Entry animations hold until the intro curtain starts lifting, otherwise
    // the whole sequence plays behind it and the page looks already settled.
    const booted = useBooted();
    const introComplete = useIntroComplete();
    const instant = reducedMotion || introComplete;

    const { progress: scrollYProgress } = useGlideProgress(sectionRef, ['start start', 'end start']);

    // The figure is drawn in the shared canvas, so its position comes from this
    // slot's real rect rather than from CSS. The world owns measurement:
    // anchors are stored in document space and re-measured without scroll
    // listeners, so this effect is just registration.
    useEffect(() => {
        if (!world.live) return undefined;
        return world.registerAnchor('hero-figure', slotRef.current);
    }, [world]);

    useEffect(() => {
        if (!world.ready) return undefined;
        const unsubscribe = scrollYProgress.on('change', (value) => world.setScroll(value));
        world.setScroll(scrollYProgress.get());
        return unsubscribe;
    }, [world, scrollYProgress]);

    // Stop the render loop once the hero is off screen. A full-page RAF loop
    // drawing something nobody can see is the main battery cost of this
    // design. Phase 2 replaces this with per-station culling once other
    // sections own 3D content.
    useEffect(() => {
        if (!world.live) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => world.setVisible(entry.isIntersecting),
            { rootMargin: '10%' },
        );
        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, [world]);

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
            className="relative overflow-hidden bg-indigo-deep pb-16 pt-28 text-canvas sm:pb-20 sm:pt-32"
        >
            {/* Deep zone wash. Decorative only — no text sits on these. */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <span className="absolute -left-[10%] top-[6%] h-[60vh] w-[60vh] rounded-full bg-indigo/60 blur-3xl" />
                <span className="absolute -right-[12%] top-[30%] h-[46vh] w-[46vh] rounded-full bg-pink/20 blur-3xl" />
                <span className="absolute bottom-[-20%] left-[25%] h-[40vh] w-[70vh] rounded-full bg-amber/10 blur-3xl" />
            </div>

            <motion.div
                data-hero-content=""
                className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-5 text-center sm:px-8"
            >
                <motion.span
                    {...show(0.24, { opacity: 0, y: 10 })}
                    className="font-hand block text-2xl text-amber sm:text-3xl"
                >
                    {profile.greeting}
                </motion.span>

                {/* The name is a real <h1> sitting BEHIND the figure. The canvas
                    renders above the document, so the clay body occludes these
                    glyphs without the name ever leaving the DOM. */}
                <h1 className="mt-2 font-display text-name leading-[0.86] text-canvas">
                    {profile.nameLines.map((line) => (
                        <span key={line} className="block pb-[0.06em]">
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

                {/* The figure's stage. Sized in CSS, read as a rect by the
                    world; data-figure-grab is the drag hit area, and it is the
                    one element here that takes pointer events.

                    The negative margin is small on purpose. The figure is
                    meant to stand in FRONT of the name, but the name has to
                    stay readable, so it overlaps only the descender band of
                    the last line rather than the middle of both. */}
                <div
                    ref={slotRef}
                    data-hero-figure-slot
                    data-figure-grab
                    aria-hidden="true"
                    onClick={() => world.react()}
                    className="pointer-events-auto -mt-[2.5vh] mb-4 h-[38vh] w-full max-w-[360px] cursor-grab active:cursor-grabbing sm:h-[42vh]"
                />

                <motion.div
                    {...show(0.62)}
                    className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
                >
                    <span className="rounded-full bg-amber px-4 py-1.5 font-display text-sm font-semibold text-ink sm:text-base">
                        {profile.role}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[0.75rem] text-canvas/70">
                        <MapPin size={13} aria-hidden="true" />
                        {profile.location}
                    </span>
                </motion.div>

                <motion.p
                    {...show(0.72)}
                    data-hero-intro
                    className="mt-6 max-w-xl text-base leading-relaxed text-canvas/85 sm:text-lg"
                >
                    {profile.intro}
                </motion.p>

                <motion.div {...show(0.82)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
                        className="border-canvas/40 text-canvas hover:bg-canvas hover:text-ink"
                        icon={<Download size={16} />}
                    >
                        {profile.resume.label}
                    </Button>
                </motion.div>

                <Annotation className="mt-10 block text-amber" rotate={-4}>
                    built to connect
                </Annotation>
            </motion.div>
        </section>
    );
};

export default Hero;
