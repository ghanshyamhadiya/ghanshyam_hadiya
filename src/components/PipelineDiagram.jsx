import React from 'react';
import { motion } from 'framer-motion';
import {
    Database,
    ArrowRightLeft,
    Shuffle,
    Layers,
    LineChart,
    Workflow,
    ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { viewport, EASE_OUT_EXPO } from '../utils/motion';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Data-driven architecture diagram, built from `project.architecture`.
//
// Implementation notes:
//
// 1. The node boxes are real HTML rather than SVG <text>. SVG text does not
//    wrap or reflow, which is fragile across breakpoints and forces duplicated
//    aria labels. HTML keeps the labels selectable, screen-reader-native and
//    user-scalable; only the connectors are decorative.
//
// 2. One DOM serves both layouts, switched purely with CSS. A six-node vertical
//    stack is ~580px tall, which would blow out the sticky project card on a
//    phone — so below `md` the nodes collapse to a compact wrapped chip flow
//    with chevrons, and from `md` up they expand into full boxes with notes and
//    travelling flow dots. Rendering two trees would duplicate every label for
//    assistive tech.

const KINDS = {
    source: { Icon: Database, tag: 'Source' },
    ingest: { Icon: ArrowRightLeft, tag: 'Ingest' },
    transform: { Icon: Shuffle, tag: 'Transform' },
    store: { Icon: Layers, tag: 'Store' },
    serve: { Icon: LineChart, tag: 'Serve' },
};

const Connector = ({ index, reducedMotion }) => (
    <li aria-hidden="true" className="flex shrink-0 items-center justify-center md:w-7">
        <ChevronRight size={12} className="text-subtle md:hidden" />

        <span className="relative hidden h-px w-full bg-line-strong md:block">
            {!reducedMotion && (
                <span
                    className="absolute top-1/2 h-1 w-1 -translate-y-1/2 bg-accent animate-[flow-right_1.6s_ease-in-out_infinite]"
                    style={{ animationDelay: `${index * 0.35}s` }}
                />
            )}
        </span>
    </li>
);

const Node = ({ node, index, reducedMotion }) => {
    const { Icon, tag } = KINDS[node.kind] ?? KINDS.transform;

    return (
        <motion.li
            initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
            whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.4, delay: index * 0.05, ease: EASE_OUT_EXPO }}
            className={cn(
                'flex min-w-0 items-center gap-2 border border-line bg-surface-2/80 px-2.5 py-1.5',
                'transition-colors duration-300 hover:border-accent/45',
                'md:flex-1 md:flex-col md:items-stretch md:px-3 md:py-3 md:text-center'
            )}
        >
            <Icon
                size={13}
                className="shrink-0 text-accent md:mx-auto md:mb-2 md:size-[15px]"
                aria-hidden="true"
                strokeWidth={1.75}
            />

            <span className="label hidden text-[0.52rem] tracking-[0.16em] text-subtle md:block">
                {tag}
            </span>

            <span className="truncate font-mono text-[0.7rem] leading-snug text-ink md:mt-1 md:whitespace-normal md:text-[0.75rem]">
                {node.label}
            </span>

            {node.note && (
                <span className="hidden font-mono text-[0.58rem] leading-snug text-subtle md:mt-1 md:block">
                    {node.note}
                </span>
            )}
        </motion.li>
    );
};

const PipelineDiagram = ({ architecture, className }) => {
    const reducedMotion = usePrefersReducedMotion();
    if (!architecture?.nodes?.length) return null;

    const { nodes, orchestrator, note } = architecture;

    const description = `Data flow: ${nodes
        .map((node) => `${KINDS[node.kind]?.tag ?? 'Step'} ${node.label}`)
        .join(', then ')}.${orchestrator ? ` Orchestrated by ${orchestrator}.` : ''}`;

    return (
        <figure className={cn('grid-bg-sm border border-line bg-surface/50 p-3.5 sm:p-5', className)}>
            {orchestrator && (
                <div className="mb-3.5 flex items-center gap-2 border border-dashed border-accent/35 bg-accent-soft px-3 py-1.5 sm:py-2">
                    <Workflow size={13} className="shrink-0 text-accent" aria-hidden="true" />
                    <span className="label text-[0.52rem] text-accent sm:text-[0.58rem]">
                        Orchestration
                    </span>
                    <span className="ml-auto truncate font-mono text-[0.62rem] text-muted sm:text-[0.68rem]">
                        {orchestrator}
                    </span>
                </div>
            )}

            <ol
                className="flex flex-wrap items-center gap-1.5 md:flex-nowrap md:items-stretch md:gap-0"
                aria-label={description}
            >
                {nodes.map((node, index) => (
                    <React.Fragment key={node.id}>
                        <Node node={node} index={index} reducedMotion={reducedMotion} />
                        {index < nodes.length - 1 && (
                            <Connector index={index} reducedMotion={reducedMotion} />
                        )}
                    </React.Fragment>
                ))}
            </ol>

            {note && (
                <figcaption className="mt-3.5 hidden border-t border-line pt-3 text-[0.72rem] leading-relaxed text-subtle sm:block">
                    {note}
                </figcaption>
            )}
        </figure>
    );
};

export default PipelineDiagram;
