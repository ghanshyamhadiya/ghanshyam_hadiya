import React from 'react';
import Section from './Section';
import Reveal from './Reveal';
import { process } from '../data';
import { stagger } from '../utils/motion';

const TONES = [
    'bg-surface',
    'bg-canvas',
    'bg-surface',
    'bg-canvas',
];

const Step = ({ step, index }) => (
    <Reveal
        as="li"
        delay={stagger(index)}
        className={`group relative flex flex-col rounded-2xl border border-line p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7 ${
            TONES[index % TONES.length]
        }`}
    >
        <span className="label text-pink-deep">Step {String(index + 1).padStart(2, '0')}</span>

        <h3 className="mt-4 font-display text-xl leading-tight sm:text-2xl">{step.title}</h3>

        <p className="mt-3 flex-1 text-[0.9rem] leading-relaxed text-muted">{step.body}</p>

        {step.aside && (
            <span className="mt-5 inline-flex w-max rounded-full bg-amber-soft px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.06em] text-ink">
                {step.aside}
            </span>
        )}
    </Reveal>
);

// "How I work" — the reference site's numbered How-it-works pattern, which for
// a data engineer doubles as evidence: it shows a repeatable process rather
// than one-off scripts.
const Process = () => (
    <Section
        id="process"
        index="02"
        eyebrow="How I work"
        title="Four steps, every time"
        intro="The same sequence whether it is an ODI mapping or a Databricks notebook. Most pipeline failures are decisions skipped in the first two steps."
        tone="soft"
    >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, index) => (
                <Step key={step.title} step={step} index={index} />
            ))}
        </ol>
    </Section>
);

export default Process;
