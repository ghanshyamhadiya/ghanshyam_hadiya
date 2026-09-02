import React from 'react';
import { motion } from 'framer-motion';
import { stats } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';
import useCountUp from '../hooks/useCountUp';

const Stat = ({ stat, index }) => {
    const [ref, display] = useCountUp(stat.value);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55, delay: index * 0.08, ease: EASE_OUT_EXPO }}
            // flex-col-reverse keeps the value visually above the label while
            // preserving the required dt-before-dd document order.
            className="flex flex-col-reverse border-t border-line pt-5"
        >
            <dt className="mt-3 text-sm leading-snug text-muted">{stat.label}</dt>
            <dd
                ref={ref}
                className="font-mono text-metric font-medium leading-none tabular-nums text-accent"
            >
                {display}
            </dd>
        </motion.div>
    );
};

// Impact bar directly under the hero. The strongest single credibility signal
// on the page, which is why it sits above everything except the introduction.
const Stats = () => {
    if (!stats.length) return null;

    return (
        <section id="impact" aria-label="Impact at a glance" className="px-5 pb-4 sm:px-8">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 md:gap-x-10">
                {stats.map((stat, index) => (
                    <Stat key={stat.label} stat={stat} index={index} />
                ))}
            </dl>
        </section>
    );
};

export default Stats;
