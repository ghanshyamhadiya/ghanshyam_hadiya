import React from 'react';
import { motion, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';
import { BUILD_END, buildLines } from '../../utils/pipeline';

// Narrates the pipeline as it assembles.
//
// Every line comes from utils/pipeline.js, which derives them purely from the
// project data — see the honesty note there before changing anything.
//
// aria-hidden because it restates content already on the page and already
// announced; reading it aloud would duplicate the whole stage.
const Line = ({ line, index, count, progress }) => {
    // Spread across the same window the flow builds in, so the narration and
    // the diagram advance together.
    const step = BUILD_END / Math.max(count, 1);
    const at = index * step;
    const opacity = useTransform(progress, [at, at + step * 0.6], [0, 1]);
    const x = useTransform(progress, [at, at + step * 0.6], [-6, 0]);

    return (
        <motion.li style={{ opacity, x }} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-canvas/35">{line.step}</span>
            <span className={cn(line.done ? 'text-amber' : 'text-canvas/75')}>{line.text}</span>
            {line.note && <span className="text-canvas/40">{line.note}</span>}
            {line.ok && <span className="text-amber">ok</span>}
        </motion.li>
    );
};

const RunLog = ({ project, progress, className }) => {
    const lines = buildLines(project);
    if (!lines.length) return null;

    return (
        <ul
            aria-hidden="true"
            className={cn(
                'space-y-1 rounded-md bg-indigo-deep/50 p-4 font-mono text-[0.68rem] leading-relaxed',
                className
            )}
        >
            {lines.map((line, index) => (
                <Line
                    key={`${line.step}-${line.text}`}
                    line={line}
                    index={index}
                    count={lines.length}
                    progress={progress}
                />
            ))}
        </ul>
    );
};

export default RunLog;
