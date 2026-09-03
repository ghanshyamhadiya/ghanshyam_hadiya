import React from 'react';
import { motion } from 'framer-motion';
import { stats } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';
import useCountUp from '../hooks/useCountUp';

const Stat = ({ stat, index }) => {
    const [ref, display] = useCountUp(stat.value);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, delay: index * 0.07, ease: EASE_OUT_EXPO }}
            // flex-col-reverse keeps the value visually above the label while
            // preserving the required dt-before-dd document order.
            className="group relative flex flex-col-reverse px-4 py-6 sm:px-6"
        >
            <dt className="mt-2.5 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.1em] text-subtle">
                {stat.label}
            </dt>
            <dd
                ref={ref}
                className="font-display text-metric leading-none tabular-nums text-accent"
            >
                {display}
            </dd>

            <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-px w-0 bg-accent transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
            />
        </motion.div>
    );
};

// Impact readout directly under the hero. Divided by hairlines rather than
// boxed, so it reads as a single instrument panel.
const Stats = () => {
    if (!stats.length) return null;

    return (
        <section id="impact" aria-label="Impact at a glance" className="border-t border-line">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-line border-x border-line px-0 sm:divide-y-0 md:grid-cols-4">
                {stats.map((stat, index) => (
                    <Stat key={stat.label} stat={stat} index={index} />
                ))}
            </dl>
        </section>
    );
};

export default Stats;
