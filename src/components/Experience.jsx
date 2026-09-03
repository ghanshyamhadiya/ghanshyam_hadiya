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
        className="group relative pb-11 pl-7 last:pb-0 sm:pb-14 sm:pl-12"
    >
        {/* Square node, rotated to a diamond on the current role */}
        <span
            className="absolute left-0 top-1 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center border border-line-strong bg-bg transition-colors duration-400 group-hover:border-accent"
            aria-hidden="true"
        >
            <span
                className={
                    item.current
                        ? 'h-1.5 w-1.5 rotate-45 bg-accent'
                        : 'h-1.5 w-1.5 bg-subtle transition-colors duration-400 group-hover:bg-accent'
                }
            />
        </span>

        <div className="grid gap-x-8 gap-y-4 md:grid-cols-12">
            <div className="md:col-span-3">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-subtle tabular-nums">
                    {item.start} → {item.current ? 'Present' : item.end}
                </p>
                {item.current && (
                    <span className="mt-2 inline-flex items-center gap-1.5 border border-accent/45 bg-accent-soft px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-accent">
                        <span className="h-1 w-1 bg-accent" />
                        Current
                    </span>
                )}
            </div>

            <div className="md:col-span-9">
                <h3 className="font-display text-xl leading-tight text-ink sm:text-2xl">
                    {item.role}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[0.8rem] text-accent">{item.company}</span>
                    {item.location && (
                        <span className="inline-flex items-center gap-1 font-mono text-[0.68rem] text-subtle">
                            <MapPin size={11} aria-hidden="true" />
                            {item.location}
                        </span>
                    )}
                </div>

                {item.companyNote && (
                    <p className="mt-1 text-[0.78rem] text-subtle">{item.companyNote}</p>
                )}

                {item.summary && (
                    <p className="mt-4 text-sm leading-relaxed text-muted">{item.summary}</p>
                )}

                {item.achievements?.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                        {item.achievements.map((achievement) => (
                            <li
                                key={achievement}
                                className="flex gap-3 text-sm leading-relaxed text-muted"
                            >
                                <span
                                    className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent/70"
                                    aria-hidden="true"
                                />
                                {achievement}
                            </li>
                        ))}
                    </ul>
                )}

                {item.stack?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                        {item.stack.map((tech) => (
                            <span
                                key={tech}
                                className="border border-line px-2 py-1 font-mono text-[0.62rem] text-subtle"
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
            index="03"
            eyebrow="Career"
            title="Where I've done it"
            intro="Roles, scope and the outcomes that came out of them."
        >
            <div ref={listRef} className="relative">
                <span className="absolute bottom-0 left-0 top-1 w-px bg-line" aria-hidden="true" />
                <motion.span
                    style={{ scaleY: lineScale }}
                    className="absolute bottom-0 left-0 top-1 w-px origin-top bg-accent"
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
