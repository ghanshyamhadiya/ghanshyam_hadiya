import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';
import Section from './Section';
import PipelineDiagram from './PipelineDiagram';
import { featuredProjects } from '../data';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// How much each card shrinks as the next one slides over it.
const SCALE_STEP = 0.05;

const ProjectCard = ({ project, index, total, progress, reducedMotion }) => {
    const cardRef = useRef(null);
    const hasRepo = project.links?.repo && !project.links.repo.startsWith('TODO:');

    // The last card stays full size; earlier cards end up progressively
    // smaller, which is what produces the layered stack.
    const targetScale = 1 - (total - 1 - index) * SCALE_STEP;

    // A card only starts reacting once it has become the pinned one.
    const range = [index / total, 1];
    const scale = useTransform(progress, range, [1, targetScale]);
    const brightness = useTransform(progress, range, ['brightness(1)', 'brightness(0.5)']);

    return (
        <div
            ref={cardRef}
            // pt keeps the pinned card clear of the floating navbar.
            className="sticky top-0 flex h-[100svh] items-center justify-center px-5 pb-4 pt-20 sm:px-8 md:pt-24"
            style={{ zIndex: index + 1 }}
        >
            {/* Deliberately NOT an <a>. The card contains its own repository
                link, and wrapping the whole thing in an anchor would nest
                interactive elements — invalid HTML and ambiguous for screen
                readers and keyboard users. */}
            <motion.article
                style={
                    reducedMotion
                        ? undefined
                        : {
                              scale,
                              filter: brightness,
                              // Staggered offset so the edge of every buried
                              // card stays visible.
                              top: `calc(-3vh + ${index * 20}px)`,
                              transformOrigin: 'top center',
                          }
                }
                className="group relative w-full max-w-5xl origin-top rounded-2xl border border-line bg-surface p-5 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)] transition-colors duration-500 hover:border-accent/30 sm:p-7 md:p-9"
            >
                {/* Header */}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle tabular-nums">
                        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
                        {project.year}
                    </span>
                </div>

                <h3 className="mt-3 font-display text-card leading-[1.05] text-ink">
                    {project.title}
                </h3>
                <p className="mt-1.5 font-mono text-[0.7rem] tracking-[0.06em] text-accent sm:text-[0.75rem]">
                    {project.tagline}
                </p>

                {/* Problem / Approach — the two things a reviewer looks for
                    first. Approach is hidden on the smallest screens so the
                    card still fits one viewport in the sticky stack. */}
                <div className="mt-5 grid gap-x-8 gap-y-4 sm:mt-6 md:grid-cols-2">
                    <div>
                        <h4 className="label text-[0.6rem] text-subtle">Problem</h4>
                        <p className="mt-2 line-clamp-3 text-[0.85rem] leading-relaxed text-muted md:line-clamp-none sm:text-sm">
                            {project.problem}
                        </p>
                    </div>
                    <div className="hidden sm:block">
                        <h4 className="label text-[0.6rem] text-subtle">Approach</h4>
                        <p className="mt-2 text-[0.85rem] leading-relaxed text-muted sm:text-sm">
                            {project.solution}
                        </p>
                    </div>
                </div>

                <PipelineDiagram architecture={project.architecture} className="mt-5 sm:mt-6" />

                {/* Metrics + stack + repo */}
                <div className="mt-5 grid gap-5 sm:mt-6 md:grid-cols-12 md:items-end md:gap-8">
                    {project.metrics?.length > 0 && (
                        // flex-col-reverse on each pair shows the value above
                        // the label while keeping dt before dd in the DOM.
                        <dl className="flex flex-wrap gap-x-7 gap-y-3 md:col-span-7">
                            {project.metrics.map((metric) => (
                                <div key={metric.label} className="flex flex-col-reverse">
                                    <dt className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-subtle">
                                        {metric.label}
                                    </dt>
                                    <dd className="font-mono text-lg font-medium leading-none text-accent tabular-nums sm:text-xl">
                                        {metric.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}

                    <div className="md:col-span-5 md:justify-self-end">
                        {hasRepo ? (
                            <a
                                href={project.links.repo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2.5 rounded-full border border-line-strong px-5 py-3 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-muted transition-colors duration-300 hover:border-accent/50 hover:text-accent"
                            >
                                <Github size={14} aria-hidden="true" />
                                View repository
                                <ArrowUpRight
                                    size={13}
                                    className="transition-transform duration-300 group-hover:rotate-45"
                                />
                            </a>
                        ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-line px-5 py-3 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-subtle">
                                Repository link pending
                            </span>
                        )}
                    </div>
                </div>

                {/* Stack — desktop only; the diagram already names the tools. */}
                {project.stack?.length > 0 && (
                    <div className="mt-6 hidden flex-wrap gap-2 border-t border-line pt-5 md:flex">
                        {project.stack.map((tech) => (
                            <span
                                key={tech}
                                className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.65rem] text-subtle"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                )}
            </motion.article>
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
        <Section
            id="work"
            eyebrow="Selected work"
            title="Pipelines I've built"
            intro="Each one framed the way a reviewer reads it: the problem, the architecture, the numbers, then the code."
            bleed
        >
            <div ref={containerRef} className="relative">
                {featuredProjects.map((project, index) => (
                    <ProjectCard
                        key={project.slug}
                        project={project}
                        index={index}
                        total={featuredProjects.length}
                        progress={scrollYProgress}
                        reducedMotion={reducedMotion}
                    />
                ))}
            </div>
        </Section>
    );
};

export default Projects;
