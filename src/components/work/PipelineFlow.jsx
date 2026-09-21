import React from 'react';
import { motion, useTransform } from 'framer-motion';
import { Database, ArrowRightLeft, Shuffle, Layers, LineChart } from 'lucide-react';
import { cn } from '../../utils/cn';
import { BUILD_END } from '../../utils/pipeline';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

// The architecture, assembled node by node as the stage scrolls past.
//
// Replaces PipelineDiagram, which rendered everything at once and had no way to
// express a build. Driven by the latched stage progress from useStageProgress,
// so it assembles on the way down and stays assembled on the way back up.

const KINDS = {
    source: { Icon: Database, tag: 'Source' },
    ingest: { Icon: ArrowRightLeft, tag: 'Ingest' },
    transform: { Icon: Shuffle, tag: 'Transform' },
    store: { Icon: Layers, tag: 'Store' },
    serve: { Icon: LineChart, tag: 'Serve' },
};

// Window of progress over which one item appears.
const windowFor = (index, count) => {
    const step = BUILD_END / Math.max(count, 1);
    const start = index * step;
    return [start, start + step * 0.85];
};

const FlowNode = ({ node, index, count, progress, isEdge }) => {
    const { Icon, tag } = KINDS[node.kind] ?? KINDS.transform;
    const [from, to] = windowFor(index, count);

    const opacity = useTransform(progress, [from, to], [0, 1]);
    const scale = useTransform(progress, [from, to], [0.82, 1]);
    const y = useTransform(progress, [from, to], [14, 0]);

    return (
        <motion.li
            style={{ opacity, scale, y }}
            className={cn(
                'flex shrink-0 snap-start items-center gap-2 rounded-md px-3 py-2.5',
                'lg:min-w-0 lg:flex-1 lg:shrink lg:flex-col lg:items-stretch lg:px-3 lg:py-3.5 lg:text-center',
                // Source and serve are amber so the direction of flow reads at
                // a glance without needing to read a single label.
                isEdge ? 'bg-amber text-ink' : 'bg-canvas text-ink'
            )}
        >
            <Icon
                size={14}
                className="shrink-0 text-indigo lg:mx-auto lg:mb-2"
                aria-hidden="true"
                strokeWidth={2.2}
            />

            <span className="label hidden text-[0.5rem] tracking-[0.14em] text-subtle lg:block">
                {tag}
            </span>

            <span className="whitespace-nowrap font-display text-[0.8rem] font-semibold leading-snug lg:mt-1 lg:whitespace-normal">
                {node.label}
            </span>

            {node.note && (
                <span className="hidden font-mono text-[0.58rem] leading-snug text-subtle lg:mt-1 lg:block">
                    {node.note}
                </span>
            )}
        </motion.li>
    );
};

const Connector = ({ index, count, progress, reducedMotion, built }) => {
    // Draws just after the node before it lands.
    const [from, to] = windowFor(index, count);
    const scaleX = useTransform(progress, [from + 0.01, to + 0.02], [0, 1]);
    const opacity = useTransform(progress, [from, from + 0.01], [0, 1]);

    return (
        <li aria-hidden="true" className="flex shrink-0 items-center px-1 lg:w-6 lg:px-0">
            <motion.span
                style={{ opacity }}
                className="relative block h-0.5 w-4 overflow-hidden rounded-full bg-canvas/30 lg:w-full"
            >
                <motion.span
                    style={{ scaleX }}
                    className="block h-full w-full origin-left rounded-full bg-canvas/45"
                />
                {built && !reducedMotion && (
                    <span
                        className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber animate-[flow-right_1.5s_ease-in-out_infinite]"
                        style={{ animationDelay: `${index * 0.3}s` }}
                    />
                )}
            </motion.span>
        </li>
    );
};

const PipelineFlow = ({ architecture, progress, built, className }) => {
    const reducedMotion = usePrefersReducedMotion();
    if (!architecture?.nodes?.length) return null;

    const { nodes, orchestrator } = architecture;
    const count = nodes.length;

    // One sentence for assistive technology, so the whole path is conveyed
    // without walking every node.
    const description = `Data flow: ${nodes
        .map((node) => `${KINDS[node.kind]?.tag ?? 'Step'} ${node.label}`)
        .join(', then ')}.${orchestrator ? ` Orchestrated by ${orchestrator}.` : ''}`;

    return (
        <div className={cn('relative', className)}>
            {orchestrator && (
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-canvas/10 px-3 py-1.5">
                    <span className="label text-[0.52rem] text-amber">Orchestration</span>
                    <span className="font-mono text-[0.65rem] text-canvas/80">{orchestrator}</span>
                </div>
            )}

            {/* Horizontal strip on phones, full row from lg. The strip is the
                pattern already proven in the previous diagram — wrapping
                stranded connector chevrons at the start of lines. */}
            <div className="relative">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-indigo to-transparent lg:hidden"
                />

                <ol
                    className="no-scrollbar -mx-1 flex snap-x snap-mandatory items-stretch overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0"
                    aria-label={description}
                >
                    {nodes.map((node, index) => (
                        <React.Fragment key={node.id}>
                            <FlowNode
                                node={node}
                                index={index}
                                count={count}
                                progress={progress}
                                isEdge={index === 0 || index === count - 1}
                            />
                            {index < count - 1 && (
                                <Connector
                                    index={index}
                                    count={count}
                                    progress={progress}
                                    reducedMotion={reducedMotion}
                                    built={built}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </ol>
            </div>
        </div>
    );
};

export default PipelineFlow;
