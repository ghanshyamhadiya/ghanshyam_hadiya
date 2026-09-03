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
            // flex-col-reverse keeps the value visually above the label while
            // preserving the required dt-before-dd document order.
            className="group relative flex flex-col-reverse px-4 py-5 sm:px-6 sm:py-6"
        >
            <dt className="mt-2 font-mono text-[0.6rem] uppercase leading-relaxed tracking-[0.08em] text-subtle sm:text-[0.62rem] sm:tracking-[0.1em]">
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
        </Reveal>
    );
};

// Impact readout directly under the hero. Divided by hairlines rather than
// boxed, so it reads as a single instrument panel.
//
// The grid sits inside the same px-5/px-8 gutter as every other section; it
// previously ran edge to edge on a phone, which made it the one block that
// didn't line up with anything above or below it.
const Stats = () => {
    if (!stats.length) return null;

    return (
        <section id="impact" aria-label="Impact at a glance" className="border-t border-line">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
                <dl className="grid grid-cols-2 divide-x divide-y divide-line border-x border-b border-line md:grid-cols-4 md:divide-y-0 md:border-b-0">
                    {stats.map((stat, index) => (
                        <Stat key={stat.label} stat={stat} index={index} />
                    ))}
                </dl>
            </div>
        </section>
    );
};

export default Stats;
