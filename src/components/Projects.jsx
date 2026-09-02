import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { featuredProjects } from '../data';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// How much each card shrinks as the next one slides over it.
const SCALE_STEP = 0.05;

const ProjectCard = ({ project, index, total, progress, reducedMotion }) => {
    const cardRef = useRef(null);
    const isExternal = project.link && project.link !== '#';

    // The last card stays at full size; every earlier card ends up a little
    // smaller, which is what produces the layered stack.
    const targetScale = 1 - (total - 1 - index) * SCALE_STEP;

    // This card only starts shrinking once it has become the sticky one.
    const range = [index / total, 1];
    const scale = useTransform(progress, range, [1, targetScale]);
    const brightness = useTransform(progress, range, ['brightness(1)', 'brightness(0.55)']);

    // Slow inner drift on the image while the card is pinned.
    const { scrollYProgress: cardProgress } = useScroll({
        target: cardRef,
        offset: ['start end', 'end start'],
    });
    const imageY = useTransform(cardProgress, [0, 1], ['-8%', '8%']);

    return (
        <div
            ref={cardRef}
            // pt keeps the pinned card clear of the floating navbar.
            className="sticky top-0 flex h-[100svh] items-center justify-center pt-20 pb-4 md:pt-24"
            style={{ zIndex: index + 1 }}
        >
            <motion.a
                href={project.link}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                style={
                    reducedMotion
                        ? undefined
                        : {
                              scale,
                              filter: brightness,
                              // Staggered downward offset so the edge of every
                              // card underneath stays visible.
                              top: `calc(-4vh + ${index * 22}px)`,
                              transformOrigin: 'top center',
                          }
                }
                className="group relative block w-full max-w-5xl origin-top overflow-hidden rounded-3xl border border-white/15 bg-[#0c0c0c] p-5 sm:p-8 md:p-12 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)]"
            >
                {/* Hover wipe (pointer devices only) */}
                <span
                    className="absolute inset-0 origin-bottom scale-y-0 bg-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 max-md:hidden"
                    aria-hidden="true"
                />

                <div className="relative z-10 flex flex-col gap-5 sm:gap-8 md:flex-row md:items-center md:justify-between">
                    <div className="w-full md:w-5/12">
                        <div className="flex items-center gap-3 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-white/40 transition-colors duration-500 md:group-hover:text-black/50">
                            <span>0{index + 1}</span>
                            {project.year && <span>— {project.year}</span>}
                        </div>

                        <h3 className="mt-3 text-[1.75rem] leading-[0.95] sm:text-4xl md:text-5xl font-black uppercase tracking-tighter transition-colors duration-500 md:group-hover:text-black">
                            {project.title}
                        </h3>

                        <p className="mt-2 text-[0.7rem] sm:text-sm font-bold uppercase tracking-[0.2em] text-white/60 transition-colors duration-500 md:group-hover:text-black/70">
                            {project.tech}
                        </p>

                        <p className="mt-3 sm:mt-5 line-clamp-3 md:line-clamp-none text-sm sm:text-base leading-relaxed text-gray-400 transition-colors duration-500 md:group-hover:text-gray-700">
                            {project.description}
                        </p>

                        {project.tags?.length > 0 && (
                            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
                                {project.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-white/20 px-3 py-1 text-[0.6rem] sm:text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white/70 transition-colors duration-500 md:group-hover:border-black/25 md:group-hover:text-black/70"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-5/12">
                        <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#161616] transition-colors duration-500 md:group-hover:border-black/20">
                            <motion.img
                                src={project.image}
                                alt={project.title}
                                loading="lazy"
                                style={reducedMotion ? undefined : { y: imageY }}
                                className="h-36 sm:h-56 md:h-[300px] w-full scale-110 object-cover grayscale transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:group-hover:grayscale-0"
                            />
                        </div>
                    </div>

                    <div className="flex md:w-2/12 md:justify-end">
                        <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-white/20 bg-[#111] text-white transition-colors duration-500 md:group-hover:border-black md:group-hover:bg-black">
                            <ArrowUpRight
                                size={24}
                                className="transition-transform duration-300 md:group-hover:rotate-45"
                            />
                        </span>
                    </div>
                </div>
            </motion.a>
        </div>
    );
};

const Projects = () => {
    const containerRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    return (
        <section
            id="projects"
            className="relative scroll-mt-28 border-t border-white/10 bg-[#050505] px-5 sm:px-8 md:px-12 pt-20 sm:pt-28 md:pt-32 pb-16 sm:pb-24"
        >
            <div className="mx-auto max-w-7xl">
                <SectionHeading eyebrow="Selected Work" title="Featured Work" />
            </div>

            <div ref={containerRef} className="relative mx-auto mt-10 max-w-7xl sm:mt-14">
                {featuredProjects.map((project, index) => (
                    <ProjectCard
                        key={project.title}
                        project={project}
                        index={index}
                        total={featuredProjects.length}
                        progress={scrollYProgress}
                        reducedMotion={reducedMotion}
                    />
                ))}
            </div>
        </section>
    );
};

export default Projects;
