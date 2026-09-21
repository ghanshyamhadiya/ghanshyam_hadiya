import React from 'react';
import Reveal from './Reveal';
import { stats } from '../data';
import { stagger } from '../utils/motion';
import useCountUp from '../hooks/useCountUp';

const Stat = ({ stat, index }) => {
    const [ref, display] = useCountUp(stat.value);

    return (
        <Reveal
            delay={stagger(index)}
            // flex-col-reverse keeps the value above the label visually while
            // preserving the required dt-before-dd document order.
            className="flex flex-col-reverse border-t border-line py-6 pr-5"
        >
            <dt className="mt-2 text-[0.82rem] leading-snug text-subtle">{stat.label}</dt>
            <dd ref={ref} className="font-display text-[clamp(2rem,4vw,3.5rem)] font-medium tabular-nums">
                {display}
            </dd>
        </Reveal>
    );
};

// Impact readout. Four coloured tiles rather than a divided strip — on a light
// canvas the colour blocks carry the rhythm that hairlines carried on dark.
const Stats = () => {
    if (!stats.length) return null;

    return (
        <section id="impact" aria-label="Impact at a glance" className="bg-canvas">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-12 sm:px-8 md:grid-cols-4">
                {stats.map((stat, index) => (
                    <Stat key={stat.label} stat={stat} index={index} />
                ))}
            </dl>
        </section>
    );
};

export default Stats;
