import React, { useId, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { ArrowUpRight, Github, Plus } from 'lucide-react';
import Starburst from '../Starburst';
import Button from '../Button';
import PipelineFlow from './PipelineFlow';
import RunLog from './RunLog';
import { cn } from '../../utils/cn';
import { BUILD_END } from '../../utils/pipeline';
import { EASE_OUT_EXPO } from '../../utils/motion';
import useStageProgress from '../../hooks/useStageProgress';
import useCountUp from '../../hooks/useCountUp';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

const Metric = ({ metric, active }) => {
    // Only starts counting once the pipeline has finished assembling, so the
    // numbers read as the run's output rather than as decoration.
    const [ref, display] = useCountUp(active ? metric.value : metric.value);

    return (
        // flex-col-reverse keeps the value above the label while preserving the
        // required dt-before-dd document order.
        <div className="flex flex-col-reverse">
            <dt className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-canvas/50">
                {metric.label}
            </dt>
            <dd ref={ref} className="font-display text-2xl leading-none text-amber tabular-nums">
                {display}
            </dd>
        </div>
    );
};

const Stage = ({ project, index, total }) => {
    const ref = useRef(null);
    const progress = useStageProgress(ref);
    const reducedMotion = usePrefersReducedMotion();

    const detailId = useId();
    const [open, setOpen] = useState(false);
    const [built, setBuilt] = useState(false);

    // One state flip when the assembly completes; drives the flow dots, the
    // station marker and the metric count-up.
    useMotionValueEvent(progress, 'change', (value) => {
        if (!built && value >= BUILD_END) setBuilt(true);
    });

    const hasRepo = Boolean(project.links?.repo);

    // The station marker fills as this stage's build advances.
    const markerScale = useTransform(progress, [0, 0.12], [0.6, 1]);
    const markerOpacity = useTransform(progress, [0, 0.12], [0.35, 1]);

    return (
        <article
            ref={ref}
            id={`work-${project.slug}`}
            aria-labelledby={`${project.slug}-title`}
            className="relative scroll-mt-32 pb-16 pl-9 sm:pb-20 sm:pl-16"
        >
            {/* Station marker, sitting on the spine */}
            <motion.span
                aria-hidden="true"
                style={{ scale: markerScale, opacity: markerOpacity }}
                className={cn(
                    'absolute left-3 top-1 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border-2 font-mono text-[0.6rem] font-medium transition-colors duration-500 sm:left-5 sm:h-8 sm:w-8',
                    built
                        ? 'border-amber bg-amber text-ink'
                        : 'border-canvas/40 bg-indigo text-canvas/70'
                )}
            >
                {String(index + 1).padStart(2, '0')}
            </motion.span>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3
                        id={`${project.slug}-title`}
                        className="font-display text-card leading-[1.05] text-canvas"
                    >
                        {project.title}
                    </h3>
                    <p className="mt-1.5 font-mono text-[0.7rem] tracking-[0.04em] text-amber">
                        {project.tagline}
                    </p>
                </div>
                <Starburst label={project.year} size={54} className="shrink-0" />
            </div>

            <p className="mt-4 max-w-2xl text-[0.92rem] leading-relaxed text-canvas/75">
                {project.problem}
            </p>

            <PipelineFlow
                architecture={project.architecture}
                progress={progress}
                built={built}
                className="mt-6"
            />

            <div className="mt-5 grid gap-5 lg:grid-cols-12">
                <RunLog project={project} progress={progress} className="lg:col-span-7" />

                {project.metrics?.length > 0 && (
                    <dl className="flex flex-wrap content-start gap-x-8 gap-y-4 lg:col-span-5">
                        {project.metrics.map((metric) => (
                            <Metric key={metric.label} metric={metric} active={built} />
                        ))}
                    </dl>
                )}
            </div>

            {/* Inline unfold — nothing covers anything, the page keeps one
                reading order. */}
            <div className="mt-6">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls={detailId}
                    data-cursor={open ? 'close' : 'read more'}
                    className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 font-display text-[0.82rem] font-semibold text-ink transition-colors duration-300 hover:bg-pink-deep hover:text-canvas"
                >
                    <Plus
                        size={14}
                        className={cn('transition-transform duration-300', open && 'rotate-45')}
                        aria-hidden="true"
                    />
                    {open ? 'Hide detail' : 'Approach, stack & code'}
                </button>

                {/* Always mounted, collapsed to zero height rather than
                    unmounted. Unmounting kept the approach text, stack and the
                    repository link out of the DOM entirely, so crawlers never
                    saw them and the SSR render check could not find the repo
                    link. `inert` keeps the collapsed panel out of the tab order
                    and the accessibility tree. */}
                <motion.div
                    id={detailId}
                    initial={false}
                    animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                    transition={
                        reducedMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT_EXPO }
                    }
                    className="overflow-hidden"
                    inert={!open}
                >
                    <div className="mt-5 grid gap-6 border-t border-canvas/15 pt-5 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <h4 className="label text-amber">Approach</h4>
                            <p className="mt-2 text-[0.9rem] leading-relaxed text-canvas/75">
                                {project.solution}
                            </p>

                            {project.architecture?.note && (
                                <p className="mt-3 text-[0.82rem] leading-relaxed text-canvas/50">
                                    {project.architecture.note}
                                </p>
                            )}
                        </div>

                        <div className="lg:col-span-5">
                            <h4 className="label text-amber">Stack</h4>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {project.stack?.map((tech) => (
                                    <span
                                        key={tech}
                                        className="rounded-full bg-canvas/10 px-2.5 py-1 font-mono text-[0.65rem] text-canvas/80"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-5">
                                {hasRepo ? (
                                    <Button
                                        as="a"
                                        href={project.links.repo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="outlineInvert"
                                        size="sm"
                                        data-cursor="open repo"
                                        icon={<ArrowUpRight size={14} />}
                                    >
                                        <Github size={14} aria-hidden="true" />
                                        View repository
                                    </Button>
                                ) : (
                                    <span className="inline-flex items-center rounded-full border border-dashed border-canvas/30 px-4 py-2 font-mono text-[0.66rem] text-canvas/60">
                                        Code available on request
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <span className="sr-only">
                Project {index + 1} of {total}
            </span>
        </article>
    );
};

export default Stage;
