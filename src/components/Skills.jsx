import React from 'react';
import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading';
import Reveal from './Reveal';
import { skillGroups, skillTags } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

const SkillRow = ({ skill, index }) => (
    <li className="group">
        <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm sm:text-base font-bold uppercase tracking-[0.12em] text-white/80 transition-colors duration-300 group-hover:text-white">
                {skill.name}
            </span>
            <span className="text-[0.65rem] font-bold tracking-[0.2em] text-white/35 tabular-nums">
                {skill.level}
            </span>
        </div>
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: skill.level / 100 }}
                viewport={viewport}
                transition={{ duration: 1, delay: 0.1 + index * 0.07, ease: EASE_OUT_EXPO }}
                className="h-full w-full origin-left rounded-full bg-white"
            />
        </div>
    </li>
);

const Skills = () => {
    const reducedMotion = usePrefersReducedMotion();

    return (
        <section
            id="skills"
            className="relative scroll-mt-28 overflow-hidden border-t border-white/10 px-5 sm:px-8 md:px-12 py-20 sm:py-28 md:py-32"
        >
            <div className="mx-auto max-w-7xl">
                <SectionHeading eyebrow="Toolkit" title="Skills" />

                <div className="mt-14 grid gap-6 sm:gap-8 md:grid-cols-3">
                    {skillGroups.map((group, groupIndex) => (
                        <Reveal
                            key={group.category}
                            delay={groupIndex * 0.12}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
                        >
                            <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-white/50">
                                <span className="h-px w-6 bg-white/30" aria-hidden="true" />
                                {group.category}
                            </h3>
                            <ul className="mt-7 space-y-5">
                                {group.items.map((skill, index) => (
                                    <SkillRow key={skill.name} skill={skill} index={index} />
                                ))}
                            </ul>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* Infinite tag marquee */}
            <div className="relative mt-16 sm:mt-20 -mx-5 sm:-mx-8 md:-mx-12 overflow-hidden border-y border-white/10 py-5">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />

                <motion.div
                    className="flex w-max gap-8 sm:gap-12 whitespace-nowrap"
                    animate={reducedMotion ? undefined : { x: ['0%', '-50%'] }}
                    transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                >
                    {[...skillTags, ...skillTags].map((tag, index) => (
                        <span
                            key={`${tag}-${index}`}
                            className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-white/25"
                        >
                            {tag}
                            <span className="ml-8 sm:ml-12 text-white/10">/</span>
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Skills;
