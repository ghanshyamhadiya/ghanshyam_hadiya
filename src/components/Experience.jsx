import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MapPin } from 'lucide-react';
import SectionHeading from './SectionHeading';
import Reveal from './Reveal';
import { experience } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

const TimelineItem = ({ item, index }) => (
    <motion.article
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.75, delay: index * 0.08, ease: EASE_OUT_EXPO }}
        className="group relative pl-12 sm:pl-16 pb-12 last:pb-0"
    >
        {/* Node on the timeline */}
        <motion.span
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.5, delay: 0.15 + index * 0.08, ease: EASE_OUT_EXPO }}
            className="absolute left-0 top-2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0a0a0a] transition-colors duration-500 group-hover:border-white/60"
            aria-hidden="true"
        >
            <span className="h-2 w-2 rounded-full bg-white/50 transition-all duration-500 group-hover:bg-white group-hover:shadow-[0_0_12px_3px_rgba(255,255,255,0.35)]" />
        </motion.span>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 backdrop-blur-sm transition-all duration-500 group-hover:border-white/25 group-hover:bg-white/[0.06] group-hover:-translate-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">
                    {item.role}
                </h3>
                <span className="rounded-full border border-white/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/60">
                    {item.start} — {item.end}
                </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-white/50">
                <span className="text-white/80">{item.company}</span>
                {item.location && (
                    <span className="inline-flex items-center gap-1">
                        <MapPin size={13} aria-hidden="true" />
                        {item.location}
                    </span>
                )}
            </div>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-400 transition-colors duration-500 group-hover:text-gray-300">
                {item.description}
            </p>

            {item.highlights?.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {item.highlights.map((highlight) => (
                        <li
                            key={highlight}
                            className="flex gap-3 text-sm leading-relaxed text-gray-400"
                        >
                            <span className="mt-2 h-px w-4 shrink-0 bg-white/40" aria-hidden="true" />
                            {highlight}
                        </li>
                    ))}
                </ul>
            )}

            {item.stack?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                    {item.stack.map((tech) => (
                        <span
                            key={tech}
                            className="rounded-full bg-white/[0.07] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white/70"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            )}
        </div>
    </motion.article>
);

const Experience = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start 65%', 'end 65%'],
    });
    const lineScale = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

    return (
        <section
            id="experience"
            className="relative scroll-mt-28 border-t border-white/10 px-5 sm:px-8 md:px-12 py-20 sm:py-28 md:py-32"
        >
            <div className="mx-auto max-w-5xl">
                <SectionHeading eyebrow="Career Path" title="Experience" />

                <Reveal delay={0.1} className="mt-4 max-w-xl text-sm sm:text-base text-gray-400 leading-relaxed">
                    A short history of the teams I have built with and the problems I helped solve.
                </Reveal>

                <div ref={ref} className="relative mt-14 sm:mt-20">
                    {/* Track + scroll-driven fill */}
                    <span
                        className="absolute left-0 top-2 bottom-0 w-px bg-white/10"
                        aria-hidden="true"
                    />
                    <motion.span
                        style={{ scaleY: lineScale }}
                        className="absolute left-0 top-2 bottom-0 w-px origin-top bg-gradient-to-b from-white via-white/70 to-transparent"
                        aria-hidden="true"
                    />

                    {experience.map((item, index) => (
                        <TimelineItem key={`${item.company}-${item.role}`} item={item} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Experience;
