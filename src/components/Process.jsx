import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import Section from './Section';
import { process } from '../data';
import useGlideProgress from '../hooks/useGlideProgress';

const Step = ({ step, index }) => {
    const ref = useRef(null);
    const { progress, reducedMotion } = useGlideProgress(ref, ['start 85%', 'start 40%']);
    const rotateX = useTransform(progress, [0, 1], [12, 0]);
    const y = useTransform(progress, [0, 1], [28, 0]);
    return (
        <motion.li
            ref={ref}
            data-process-step={index + 1}
            className="relative grid gap-4 border-t border-line py-8 md:grid-cols-[64px_minmax(0,1fr)_minmax(0,1.4fr)] md:gap-8"
            style={reducedMotion ? undefined : { y, rotateX, transformPerspective: 900 }}
        >
            <span aria-hidden="true" className="font-display text-3xl font-normal text-subtle">{String(index + 1).padStart(2, '0')}</span>
            <h3 className="font-display text-2xl leading-tight">{step.title}</h3>
            <div>
                <p className="text-[0.95rem] leading-relaxed text-muted">{step.body}</p>
                {step.aside && (
                    <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-wider text-pink-deep">{step.aside}</p>
                )}
            </div>
            <motion.span data-process-progress aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px origin-left bg-pink-deep" style={{ scaleX: reducedMotion ? 1 : progress }} />
        </motion.li>
    );
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
        titleLines={['Four steps,', 'every time']}
        intro="The same sequence whether it is an ODI mapping or a Databricks notebook. Most pipeline failures are decisions skipped in the first two steps."
        tone="soft"
        curved
    >
        <ol>
            {process.map((step, index) => (
                <Step key={step.title} step={step} index={index} />
            ))}
        </ol>
    </Section>
);

export default Process;
