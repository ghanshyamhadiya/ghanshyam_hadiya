import React from 'react';
import Reveal from './Reveal';
import { stats } from '../data';
import { stagger } from '../utils/motion';
import useCountUp from '../hooks/useCountUp';

const TONES = [
    'bg-surface text-ink',
    'bg-amber-soft text-ink',
    'bg-pink text-ink',
    'bg-indigo text-canvas',
];

const Stat = ({ stat, index }) => {
    const [ref, display] = useCountUp(stat.value);
    const tone = TONES[index % TONES.length];

    return (
        <Reveal
            delay={stagger(index)}
            // flex-col-reverse keeps the value above the label visually while
            // preserving the required dt-before-dd document order.
            className={`flex flex-col-reverse rounded-2xl border border-line p-5 sm:p-6 ${tone}`}
        >
            <dt className="mt-2 text-[0.82rem] leading-snug opacity-80">{stat.label}</dt>
            <dd ref={ref} className="font-display text-metric tabular-nums">
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
            <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-5 py-14 sm:gap-4 sm:px-8 md:grid-cols-4 md:py-16">
                {stats.map((stat, index) => (
                    <Stat key={stat.label} stat={stat} index={index} />
                ))}
            </dl>
        </section>
    );
};

export default Stats;
