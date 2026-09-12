import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import Section from './Section';
import { process } from '../data';
import useGlideProgress from '../hooks/useGlideProgress';

const TONES = [
    'bg-surface',
    'bg-canvas',
    'bg-surface',
    'bg-canvas',
];

const Step = ({ step, index }) => {
    const ref = useRef(null);
    const { progress, reducedMotion } = useGlideProgress(ref, ['start 85%', 'start 40%']);
    const scale = useTransform(progress, [0, 1], [0.86, 1]);
    const rotate = useTransform(progress, [0, 1], [-8, 0]);
    return <motion.li
        ref={ref}
        data-process-step={index + 1}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border border-line p-6 sm:p-7 ${TONES[index % TONES.length]}`}
    >
        <motion.span aria-hidden="true" data-process-progress className="absolute inset-x-0 top-0 h-1 origin-left bg-indigo" style={{ scaleX: reducedMotion ? 1 : progress }} />
        <div className="flex items-center justify-between gap-3">
            <span className="label text-pink-deep">Step {String(index + 1).padStart(2, '0')}</span>
            <motion.span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo font-display text-xl text-canvas" style={reducedMotion ? undefined : { scale, rotate }}>{index + 1}</motion.span>
        </div>

        <h3 className="mt-4 font-display text-xl leading-tight sm:text-2xl">{step.title}</h3>

        <p className="mt-3 flex-1 text-[0.9rem] leading-relaxed text-muted">{step.body}</p>

        {step.aside && (
            <span className="mt-5 inline-flex w-max rounded-full bg-amber-soft px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.06em] text-ink">
                {step.aside}
            </span>
        )}
    </motion.li>;
};

// "How I work" — the reference site's numbered How-it-works pattern, which for
// a data engineer doubles as evidence: it shows a repeatable process rather
// than one-off scripts.
const Process = () => (
    <Section
        id="process"
        index="02"
        eyebrow="How I work"
        title="Four steps, every time"
        titleMotion="arc"
        intro="The same sequence whether it is an ODI mapping or a Databricks notebook. Most pipeline failures are decisions skipped in the first two steps."
        tone="soft"
        curved
    >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, index) => (
                <Step key={step.title} step={step} index={index} />
            ))}
        </ol>
    </Section>
);

export default Process;
