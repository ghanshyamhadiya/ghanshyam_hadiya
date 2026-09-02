import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Section from './Section';
import { experience } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

const TimelineItem = ({ item, index }) => (
    <motion.li
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.6, delay: index * 0.06, ease: EASE_OUT_EXPO }}
        className="group relative pb-14 pl-8 last:pb-0 sm:pl-12"
    >
        {/* Node on the timeline */}
        <span
            className="absolute left-0 top-1.5 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border border-line-strong bg-bg transition-colors duration-500 group-hover:border-accent"
            aria-hidden="true"
        >
            <span
                className={
                    item.current
                        ? 'h-1.5 w-1.5 rounded-full bg-accent'
                        : 'h-1.5 w-1.5 rounded-full bg-subtle transition-colors duration-500 group-hover:bg-accent'
                }
            />
        </span>

        <div className="grid gap-x-8 gap-y-4 md:grid-cols-12">
            {/* Dates in the narrow mono column — the classic editorial move. */}
            <div className="md:col-span-3">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-subtle tabular-nums">
                    {item.start} — {item.current ? 'Present' : item.end}
                </p>
                {item.current && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-accent">
                        <span className="h-1 w-1 rounded-full bg-accent" />
                        Current
                    </span>
                )}
            </div>

            <div className="md:col-span-9">
                <h3 className="font-display text-2xl leading-tight text-ink sm:text-3xl">
                    {item.role}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-accent">{item.company}</span>
                    {item.location && (
                        <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] text-subtle">
                            <MapPin size={11} aria-hidden="true" />
                            {item.location}
                        </span>
                    )}
                </div>

                {item.companyNote && (
                    <p className="mt-1 text-[0.8rem] italic text-subtle">{item.companyNote}</p>
                )}

                {item.summary && (
                    <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                        {item.summary}
                    </p>
                )}

                {item.achievements?.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                        {item.achievements.map((achievement) => (
                            <li
                                key={achievement}
                                className="flex gap-3 text-sm leading-relaxed text-muted"
                            >
                                <span
                                    className="mt-2.5 h-px w-3.5 shrink-0 bg-accent/60"
                                    aria-hidden="true"
                                />
                                {achievement}
                            </li>
                        ))}
                    </ul>
                )}

                {item.stack?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {item.stack.map((tech) => (
                            <span
                                key={tech}
                                className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.65rem] text-subtle"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </motion.li>
);

const Experience = () => {
    const listRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: listRef,
        offset: ['start 65%', 'end 65%'],
    });
    const lineScale = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });

    return (
        <Section
            id="experience"
            eyebrow="Career"
            title="Where I've done it"
            intro="Roles, scope and the outcomes that came out of them."
        >
            <div ref={listRef} className="relative">
                {/* Track plus scroll-driven fill */}
                <span className="absolute left-0 top-1.5 bottom-0 w-px bg-line" aria-hidden="true" />
                <motion.span
                    style={{ scaleY: lineScale }}
                    className="absolute left-0 top-1.5 bottom-0 w-px origin-top bg-gradient-to-b from-accent via-accent/50 to-transparent"
                    aria-hidden="true"
                />

                <ol>
                    {experience.map((item, index) => (
                        <TimelineItem
                            key={`${item.company}-${item.role}-${index}`}
                            item={item}
                            index={index}
                        />
                    ))}
                </ol>
            </div>
        </Section>
    );
};

export default Experience;
