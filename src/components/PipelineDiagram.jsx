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
//    travelling flow dots. Rendering two trees instead would duplicate every
//    label for assistive tech.

const KINDS = {
    source: { Icon: Database, tag: 'Source' },
    ingest: { Icon: ArrowRightLeft, tag: 'Ingest' },
    transform: { Icon: Shuffle, tag: 'Transform' },
    store: { Icon: Layers, tag: 'Store' },
    serve: { Icon: LineChart, tag: 'Serve' },
};

// The travelling dot must move down the line on mobile and along it on desktop.
// A JS animation can't switch axis responsively, so movement comes from two CSS
// keyframe sets (flow-down / flow-right in index.css) chosen by a media
// variant. Percentages resolve against the parent line, so the dot always
// travels exactly its length.
const Connector = ({ index, reducedMotion }) => (
    <li aria-hidden="true" className="flex shrink-0 items-center justify-center md:w-7">
        {/* Compact chevron below md */}
        <ChevronRight size={13} className="text-subtle md:hidden" />

        {/* Hairline from md up */}
        <span className="relative hidden h-px w-full bg-line-strong md:block">
            {!reducedMotion && (
                <span
                    className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent animate-[flow-right_1.6s_ease-in-out_infinite]"
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
            initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
            whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.4, delay: index * 0.05, ease: EASE_OUT_EXPO }}
            className={cn(
                'flex min-w-0 items-center gap-2 rounded-full border border-line bg-surface-2/70 px-2.5 py-1.5',
                'md:flex-1 md:flex-col md:items-stretch md:rounded-lg md:px-3 md:py-3 md:text-center'
            )}
        >
            <Icon
                size={13}
                className="shrink-0 text-accent md:mx-auto md:mb-2 md:size-[15px]"
                aria-hidden="true"
                strokeWidth={1.75}
            />

            {/* Kind label is desktop-only — the icon carries it when compact. */}
            <span className="label hidden text-[0.55rem] tracking-[0.18em] text-subtle md:block">
                {tag}
            </span>

            <span className="truncate text-[0.72rem] font-medium leading-snug text-ink md:mt-1 md:whitespace-normal md:text-[0.8rem]">
                {node.label}
            </span>

            {node.note && (
                <span className="hidden font-mono text-[0.6rem] leading-snug text-subtle md:mt-1 md:block">
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

    // One sentence for assistive technology, so the whole flow is conveyed
    // without walking every node individually.
    const description = `Data flow: ${nodes
        .map((node) => `${KINDS[node.kind]?.tag ?? 'Step'} ${node.label}`)
        .join(', then ')}.${orchestrator ? ` Orchestrated by ${orchestrator}.` : ''}`;

    return (
        <figure className={cn('rounded-xl border border-line bg-surface/60 p-3.5 sm:p-5', className)}>
            {orchestrator && (
                <div className="mb-3.5 flex items-center gap-2 rounded-lg border border-dashed border-accent/35 bg-accent-soft px-3 py-1.5 sm:py-2">
                    <Workflow size={13} className="shrink-0 text-accent" aria-hidden="true" />
                    <span className="label text-[0.55rem] text-accent sm:text-[0.6rem]">
                        Orchestration
                    </span>
                    <span className="ml-auto truncate font-mono text-[0.65rem] text-muted sm:text-[0.7rem]">
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
                <figcaption className="mt-3.5 hidden border-t border-line pt-3 text-[0.75rem] leading-relaxed text-subtle sm:block">
                    {note}
                </figcaption>
            )}
        </figure>
    );
};

export default PipelineDiagram;
