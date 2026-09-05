import React from 'react';
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
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Data-driven architecture diagram, built from `project.architecture`.
//
// 1. Node boxes are real HTML rather than SVG <text>. SVG text does not wrap or
//    reflow, which is fragile across breakpoints and forces duplicated aria
//    labels. HTML keeps the labels selectable, screen-reader-native and
//    user-scalable; only the connectors are decorative.
//
// 2. One DOM serves both layouts, switched purely with CSS. Below `md` the
//    nodes form a single swipeable strip; from `md` up they expand into full
//    boxes with notes and travelling flow dots. Rendering two trees would
//    duplicate every label for assistive tech.

const KINDS = {
    source: { Icon: Database, tag: 'Source' },
    ingest: { Icon: ArrowRightLeft, tag: 'Ingest' },
    transform: { Icon: Shuffle, tag: 'Transform' },
    store: { Icon: Layers, tag: 'Store' },
    serve: { Icon: LineChart, tag: 'Serve' },
};

const Connector = ({ index, reducedMotion }) => (
    <li
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center px-1 md:w-7 md:px-0"
    >
        <ChevronRight size={12} className="shrink-0 text-subtle md:hidden" />

        <span className="relative hidden h-0.5 w-full rounded-full bg-line md:block">
            {!reducedMotion && (
                <span
                    className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-pink animate-[flow-right_1.6s_ease-in-out_infinite]"
                    style={{ animationDelay: `${index * 0.35}s` }}
                />
            )}
        </span>
    </li>
);

const Node = ({ node }) => {
    const { Icon, tag } = KINDS[node.kind] ?? KINDS.transform;

    return (
        <li
            className={cn(
                'flex shrink-0 snap-start items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-1.5',
                'transition-colors duration-300 hover:border-indigo',
                'md:min-w-0 md:flex-1 md:shrink md:flex-col md:items-stretch md:px-3 md:py-3 md:text-center'
            )}
        >
            <Icon
                size={13}
                className="shrink-0 text-indigo md:mx-auto md:mb-2 md:size-[15px]"
                aria-hidden="true"
                strokeWidth={2}
            />

            <span className="label hidden text-[0.52rem] tracking-[0.14em] text-subtle md:block">
                {tag}
            </span>

            <span className="whitespace-nowrap font-mono text-[0.7rem] leading-snug text-ink md:mt-1 md:truncate md:whitespace-normal md:text-[0.75rem]">
                {node.label}
            </span>

            {node.note && (
                <span className="hidden font-mono text-[0.58rem] leading-snug text-subtle md:mt-1 md:block">
                    {node.note}
                </span>
            )}
        </li>
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
        <figure className={cn('rounded-2xl border border-line bg-canvas p-3.5 sm:p-5', className)}>
            {orchestrator && (
                <div className="mb-3.5 flex items-center gap-2 rounded-xl bg-amber-soft px-3 py-1.5 sm:py-2">
                    <Workflow size={13} className="shrink-0 text-ink" aria-hidden="true" />
                    <span className="label text-[0.52rem] text-ink sm:text-[0.58rem]">
                        Orchestration
                    </span>
                    <span className="ml-auto truncate font-mono text-[0.62rem] text-ink/70 sm:text-[0.68rem]">
                        {orchestrator}
                    </span>
                </div>
            )}

            {/* On a phone this is a single horizontal strip you can swipe.
                Wrapping stranded connector chevrons at the start of new lines
                and made the block three or four rows tall, which is a large
                part of why project cards stopped fitting one screen. */}
            <div className="relative">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-canvas to-transparent md:hidden"
                />

                <ol
                    className="no-scrollbar -mx-1 flex snap-x snap-mandatory items-stretch gap-0 overflow-x-auto px-1 md:mx-0 md:overflow-visible md:px-0"
                    aria-label={description}
                >
                    {nodes.map((node, index) => (
                        <React.Fragment key={node.id}>
                            <Node node={node} />
                            {index < nodes.length - 1 && (
                                <Connector index={index} reducedMotion={reducedMotion} />
                            )}
                        </React.Fragment>
                    ))}
                </ol>
            </div>

            {note && (
                <figcaption className="mt-3.5 hidden border-t border-line pt-3 text-[0.75rem] leading-relaxed text-subtle sm:block">
                    {note}
                </figcaption>
            )}
        </figure>
    );
};

export default PipelineDiagram;
