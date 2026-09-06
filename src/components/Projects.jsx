import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';
import Section from './Section';
import PipelineDiagram from './PipelineDiagram';
import Button from './Button';
import Starburst from './Starburst';
import { featuredProjects } from '../data';
import { usePrefersReducedMotion, useIsLarge } from '../hooks/useMediaQuery';

// Horizontal carousel geometry, in viewport widths.
//   EDGE  gutter before the first and after the last card
//   CARD  one card, leaving a peek of the next at the right edge
//   GAP   between cards
const EDGE_VW = 7;
const CARD_VW = 84;
const GAP_VW = 3;

// Fraction of the pinned scroll spent holding still at each end.
//
// Without these the first and last cards never sit fully framed: the row starts
// moving the instant the track's top hits the viewport, which is before the
// sticky child has finished pinning, and it stops only as the section begins
// unpinning. Measured before the holds existed, card 1 peaked at 91% readable
// and card 3 at 96%, while the middle card reached 100%.
const HOLD = 0.1;

const layout = (count) => {
    const total = EDGE_VW * 2 + count * CARD_VW + Math.max(0, count - 1) * GAP_VW;
    // How far the row must travel for the last card to be fully framed.
    const travel = Math.max(0, total - 100);
    // Holds consume scroll without moving anything, so the track is lengthened
    // to keep roughly one pixel of movement per pixel of scroll.
    const scrollLength = travel / (1 - HOLD * 2);
    return { total, travel, scrollLength };
};

const ACCENTS = ['bg-amber', 'bg-pink', 'bg-canvas'];

const ProjectCard = ({ project, index, total }) => {
    const hasRepo = Boolean(project.links?.repo);

    return (
        <li
            className="relative flex w-[86vw] max-w-[1200px] shrink-0 snap-center flex-col lg:w-[84vw]"
            style={{ scrollMarginInline: `${EDGE_VW}vw` }}
        >
            <article className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(20,18,37,0.5)] sm:p-7 md:p-9">
                <div
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-1.5 ${ACCENTS[index % ACCENTS.length]}`}
                />

                <Starburst
                    label={project.year}
                    className="absolute right-4 top-4 sm:right-6 sm:top-6"
                />

                <span className="label text-subtle">
                    Project {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </span>

                <h3 className="mt-3 max-w-[80%] font-display text-card leading-[1] text-ink">
                    {project.title}
                </h3>
                <p className="mt-2 font-mono text-[0.7rem] tracking-[0.04em] text-pink-deep sm:text-[0.75rem]">
                    {project.tagline}
                </p>

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
                        // flex-col-reverse shows the value above the label while
                        // keeping dt before dd in the DOM.
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
            </article>
        </li>
    );
};

// Scroll-pinned horizontal carousel.
//
// Replaces a sticky vertical card stack that was structurally broken: the
// incoming card rose from the bottom of the viewport and covered the outgoing
// one bottom-first, starting only ~300px after it centred. Every card's
// metrics, repository link and stack row were unreachable at any scroll
// position. The cards *fitted* the viewport, which is why the height check
// never caught it — the fault was in the mechanic, not the size.
//
// Here exactly one card occupies the frame at a time and nothing ever overlaps,
// so all of a card's content is reachable. Track height is
// `100svh + travel`, so one pixel of scroll produces one pixel of horizontal
// movement rather than a geared, floaty feel.
//
// Pinning starts at lg. Below that — and under reduced motion — the same list
// becomes a native snap scroller, because vertical-scroll-drives-horizontal is
// disorienting on a phone and swiping is what people expect there.
const Projects = () => {
    const trackRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    const isLarge = useIsLarge();
    const pinned = isLarge && !reducedMotion;

    const count = featuredProjects.length;
    const { travel, scrollLength } = layout(count);

    const { scrollYProgress } = useScroll({
        target: trackRef,
        offset: ['start start', 'end end'],
    });
    const x = useTransform(
        scrollYProgress,
        [0, HOLD, 1 - HOLD, 1],
        ['0vw', '0vw', `-${travel}vw`, `-${travel}vw`]
    );

    const cards = featuredProjects.map((project, index) => (
        <ProjectCard key={project.slug} project={project} index={index} total={count} />
    ));

    // gap and padding are inline styles, not classes: Tailwind cannot generate
    // utilities from interpolated strings, so a `gap-[${GAP_VW}vw]` class would
    // silently produce no CSS at all.
    const rowStyle = { gap: `${GAP_VW}vw`, paddingInline: `${EDGE_VW}vw` };

    return (
        <Section
            id="work"
            index="05"
            eyebrow="Selected work"
            title="Pipelines I've built"
            intro="Each one framed the way a reviewer reads it: the problem, the architecture, the numbers, then the code."
            tone="indigo"
            curved
            bleed
        >
            {pinned ? (
                <div ref={trackRef} style={{ height: `calc(100svh + ${scrollLength}vw)` }}>
                    <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden pb-6 pt-24">
                        <motion.ol style={{ x, ...rowStyle }} className="flex w-max items-stretch">
                            {cards}
                        </motion.ol>
                    </div>
                </div>
            ) : (
                <ol
                    className="no-scrollbar flex snap-x snap-mandatory items-stretch overflow-x-auto pb-4"
                    style={rowStyle}
                >
                    {cards}
                </ol>
            )}
        </Section>
    );
};

export default Projects;
