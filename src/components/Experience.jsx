import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Section from './Section';
import Reveal from './Reveal';
import { experience } from '../data';
import { stagger } from '../utils/motion';

const TimelineItem = ({ item, index }) => (
    <Reveal
        as="li"
        delay={stagger(index)}
        className="group relative pb-12 pl-7 last:pb-0 sm:pl-12"
    >
        <span
            className="absolute left-0 top-1 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-ink bg-canvas transition-colors duration-300 group-hover:bg-pink"
            aria-hidden="true"
        >
            {item.current && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
        </span>

        <div className="grid gap-x-8 gap-y-4 md:grid-cols-12">
            <div className="md:col-span-3">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-subtle tabular-nums">
                    {item.start} → {item.current ? 'Present' : item.end}
                </p>
                {item.current && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-pink px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink">
                        Current
                    </span>
                )}
            </div>

            <div className="md:col-span-9">
                <h3 className="font-display text-xl leading-tight sm:text-2xl">{item.role}</h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-display text-[0.95rem] font-semibold text-indigo">
                        {item.company}
                    </span>
                    {item.location && (
                        <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] text-subtle">
                            <MapPin size={11} aria-hidden="true" />
                            {item.location}
                        </span>
                    )}
                </div>

                {item.companyNote && (
                    <p className="mt-1 text-[0.8rem] text-subtle">{item.companyNote}</p>
                )}

                {item.summary && (
                    <p className="mt-4 text-[0.92rem] leading-relaxed text-muted">{item.summary}</p>
                )}

                {item.achievements?.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                        {item.achievements.map((achievement) => (
                            <li
                                key={achievement}
                                className="flex gap-3 text-[0.9rem] leading-relaxed text-muted"
                            >
                                <span
                                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pink"
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
    </Reveal>
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
            index="04"
            eyebrow="Career"
            title="Where I've done it"
            titleMotion="unfold"
            intro="Roles, scope and the outcomes that came out of them."
            tone="surface"
            curved
        >
            <div ref={listRef} className="relative">
                <span
                    className="absolute bottom-0 left-0 top-1 w-0.5 rounded-full bg-line"
                    aria-hidden="true"
                />
                <motion.span
                    style={{ scaleY: lineScale }}
                    className="absolute bottom-0 left-0 top-1 w-0.5 origin-top rounded-full bg-indigo"
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
