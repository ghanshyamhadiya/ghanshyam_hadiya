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
    const hasRepo = Boolean(project.links?.repo);

    // The last card stays full size; earlier cards end up progressively
    // smaller, which is what produces the layered stack.
    const targetScale = 1 - (total - 1 - index) * SCALE_STEP;
    const range = [index / total, 1];
    const scale = useTransform(progress, range, [1, targetScale]);
    const brightness = useTransform(progress, range, ['brightness(1)', 'brightness(0.45)']);

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
                              top: `calc(-3vh + ${index * 18}px)`,
                              transformOrigin: 'top center',
                          }
                }
                className="group relative w-full max-w-5xl origin-top border border-line-strong bg-surface p-5 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)] sm:p-7 md:p-9"
            >
                {/* Corner brackets */}
                {[
                    '-left-px -top-px border-l-2 border-t-2',
                    '-right-px -top-px border-r-2 border-t-2',
                    '-bottom-px -left-px border-b-2 border-l-2',
                    '-bottom-px -right-px border-b-2 border-r-2',
                ].map((position) => (
                    <span
                        key={position}
                        aria-hidden="true"
                        className={`pointer-events-none absolute h-4 w-4 border-accent opacity-0 transition-opacity duration-400 group-hover:opacity-100 ${position}`}
                    />
                ))}

                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-subtle tabular-nums">
                        Project {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-subtle">
                        {project.year}
                    </span>
                </div>

                <h3 className="mt-4 font-display text-card leading-[0.95] text-ink">
                    {project.title}
                </h3>
                <p className="mt-2 font-mono text-[0.68rem] tracking-[0.04em] text-accent sm:text-[0.72rem]">
                    {project.tagline}
                </p>

                {/* Problem / Approach — the two things a reviewer looks for
                    first. Approach is hidden on the smallest screens so the
                    card still fits one viewport in the sticky stack. */}
                <div className="mt-5 grid gap-x-8 gap-y-4 sm:mt-6 md:grid-cols-2">
                    <div className="border-l border-accent/40 pl-3.5">
                        <h4 className="label text-[0.56rem] text-subtle">Problem</h4>
                        <p className="mt-2 line-clamp-3 text-[0.82rem] leading-relaxed text-muted md:line-clamp-none">
                            {project.problem}
                        </p>
                    </div>
                    <div className="hidden border-l border-line pl-3.5 sm:block">
                        <h4 className="label text-[0.56rem] text-subtle">Approach</h4>
                        <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">
                            {project.solution}
                        </p>
                    </div>
                </div>

                <PipelineDiagram architecture={project.architecture} className="mt-5 sm:mt-6" />

                <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:mt-6 md:grid-cols-12 md:items-end md:gap-8">
                    {project.metrics?.length > 0 && (
                        // flex-col-reverse on each pair shows the value above
                        // the label while keeping dt before dd in the DOM.
                        <dl className="flex flex-wrap gap-x-7 gap-y-3 md:col-span-7">
                            {project.metrics.map((metric) => (
                                <div key={metric.label} className="flex flex-col-reverse">
                                    <dt className="mt-1.5 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-subtle">
                                        {metric.label}
                                    </dt>
                                    <dd className="font-display text-lg leading-none text-accent tabular-nums sm:text-xl">
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
                                data-cursor="open repo"
                                className="group/link relative inline-flex items-center gap-2.5 overflow-hidden border border-line-strong px-5 py-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:border-accent hover:text-bg"
                            >
                                <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/link:translate-x-0" />
                                <Github size={14} aria-hidden="true" className="relative" />
                                <span className="relative">View repository</span>
                                <ArrowUpRight
                                    size={13}
                                    className="relative transition-transform duration-300 group-hover/link:rotate-45"
                                />
                            </a>
                        ) : (
                            // Shown when links.repo is null. Reads as a
                            // deliberate choice rather than a broken link.
                            <span className="hatch inline-flex items-center gap-2 border border-dashed border-line px-5 py-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-subtle">
                                Code available on request
                            </span>
                        )}
                    </div>
                </div>

                {project.stack?.length > 0 && (
                    <div className="mt-5 hidden flex-wrap gap-1.5 border-t border-line pt-4 md:flex">
                        {project.stack.map((tech) => (
                            <span
                                key={tech}
                                className="border border-line px-2 py-1 font-mono text-[0.62rem] text-subtle"
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
            index="04"
            eyebrow="Selected work"
            title="Pipelines I've built"
            intro="Each one framed the way a reviewer reads it: the problem, the architecture, the numbers, then the code."
            bleed
        >
            <div ref={containerRef} className="relative pb-16">
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
