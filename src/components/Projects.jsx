import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';
import Section from './Section';
import PipelineDiagram from './PipelineDiagram';
import Button from './Button';
import { featuredProjects } from '../data';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// How much each card shrinks as the next one slides over it.
const SCALE_STEP = 0.04;

// One accent per card so the stack reads as distinct layers rather than a
// single repeated block. Colour encodes position, not decoration.
const ACCENTS = ['bg-amber', 'bg-pink', 'bg-indigo text-canvas'];

const ProjectCard = ({ project, index, total, progress, reducedMotion }) => {
    const cardRef = useRef(null);
    const hasRepo = Boolean(project.links?.repo);

    const targetScale = 1 - (total - 1 - index) * SCALE_STEP;
    const range = [index / total, 1];
    const scale = useTransform(progress, range, [1, targetScale]);

    return (
        <div
            ref={cardRef}
            // pt keeps the pinned card clear of the navbar.
            className="sticky top-0 flex h-[100svh] items-center justify-center px-5 pb-4 pt-20 sm:px-8 md:pt-24"
            style={{ zIndex: index + 1 }}
        >
            {/* Deliberately NOT an <a>. The card contains its own repository
                link, and wrapping it all in an anchor would nest interactive
                elements — invalid, and ambiguous for keyboard and screen
                reader users. */}
            <motion.article
                style={
                    reducedMotion
                        ? undefined
                        : {
                              scale,
                              top: `calc(-2vh + ${index * 16}px)`,
                              transformOrigin: 'top center',
                          }
                }
                className="relative w-full max-w-5xl origin-top overflow-hidden rounded-[1.75rem] border border-line bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(20,18,37,0.5)] sm:p-7 md:p-9"
            >
                <div
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-1.5 ${ACCENTS[index % ACCENTS.length]}`}
                />

                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="label text-subtle">
                        Project {String(index + 1).padStart(2, '0')} /{' '}
                        {String(total).padStart(2, '0')}
                    </span>
                    <span className="label text-subtle">{project.year}</span>
                </div>

                <h3 className="mt-3 font-display text-card leading-[1] text-ink">
                    {project.title}
                </h3>
                <p className="mt-2 font-mono text-[0.7rem] tracking-[0.04em] text-pink-deep sm:text-[0.75rem]">
                    {project.tagline}
                </p>

                {/* Approach and the full problem text only appear at lg. The
                    sticky stack requires a card to fit one viewport, and this
                    content overflowed badly at 768x900 when always shown. */}
                <div className="mt-4 grid gap-x-8 gap-y-4 sm:mt-5 lg:grid-cols-2">
                    <div className="border-l-2 border-pink pl-3.5">
                        <h4 className="label text-[0.56rem] text-subtle">Problem</h4>
                        <p className="mt-2 line-clamp-3 text-[0.85rem] leading-relaxed text-muted lg:line-clamp-none">
                            {project.problem}
                        </p>
                    </div>
                    <div className="hidden border-l-2 border-line pl-3.5 lg:block">
                        <h4 className="label text-[0.56rem] text-subtle">Approach</h4>
                        <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
                            {project.solution}
                        </p>
                    </div>
                </div>

                <PipelineDiagram architecture={project.architecture} className="mt-4 sm:mt-5" />

                <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:mt-5 sm:pt-5 md:grid-cols-12 md:items-end md:gap-8">
                    {project.metrics?.length > 0 && (
                        // flex-col-reverse shows the value above the label
                        // while keeping dt before dd in the DOM.
                        <dl className="flex flex-wrap gap-x-7 gap-y-3 md:col-span-7">
                            {project.metrics.map((metric) => (
                                <div key={metric.label} className="flex flex-col-reverse">
                                    <dt className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-subtle">
                                        {metric.label}
                                    </dt>
                                    <dd className="font-display text-xl leading-none text-indigo tabular-nums sm:text-2xl">
                                        {metric.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}

                    <div className="md:col-span-5 md:justify-self-end">
                        {hasRepo ? (
                            <Button
                                as="a"
                                href={project.links.repo}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="ink"
                                size="sm"
                                data-cursor="open repo"
                                icon={<ArrowUpRight size={14} />}
                            >
                                <Github size={14} aria-hidden="true" />
                                View repository
                            </Button>
                        ) : (
                            // Shown when links.repo is null. Reads as a
                            // deliberate choice rather than a broken link.
                            <span className="inline-flex items-center rounded-full border border-dashed border-line-strong px-4 py-2 font-mono text-[0.68rem] text-subtle">
                                Code available on request
                            </span>
                        )}
                    </div>
                </div>

                {project.stack?.length > 0 && (
                    <div className="mt-5 hidden flex-wrap gap-2 border-t border-line pt-4 lg:flex">
                        {project.stack.map((tech) => (
                            <span
                                key={tech}
                                className="rounded-full bg-canvas px-2.5 py-1 font-mono text-[0.65rem] text-subtle"
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
            index="05"
            eyebrow="Selected work"
            title="Pipelines I've built"
            intro="Each one framed the way a reviewer reads it: the problem, the architecture, the numbers, then the code."
            tone="canvas"
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
