import React from 'react';
import Section from './Section';
import Reveal from './Reveal';
import { cn } from '../utils/cn';
import { skillLayers, exploring } from '../data';
import { stagger } from '../utils/motion';

// Evidence zone: no decorative shapes behind content. Colour is used only to
// encode meaning — a filled chip means production ownership, an outlined one
// means working familiarity.
const Chip = ({ item }) => (
    <span
        className={cn(
            'rounded-full border px-3 py-1.5 font-mono text-[0.7rem] transition-colors duration-200',
            item.primary
                ? 'border-transparent bg-indigo text-canvas'
                : 'border-line-strong bg-transparent text-muted hover:border-ink hover:text-ink'
        )}
    >
        {item.name}
    </span>
);

const Layer = ({ layer, index }) => (
    <Reveal
        as="li"
        delay={stagger(index)}
        className="grid gap-3.5 border-t border-line py-6 md:grid-cols-12 md:gap-8"
    >
        <div className="flex gap-4 md:col-span-5">
            <span className="mt-0.5 font-mono text-[0.7rem] text-subtle tabular-nums">
                {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
                <h3 className="font-display text-lg leading-tight sm:text-xl">{layer.layer}</h3>
                {layer.blurb && (
                    <p className="mt-1.5 text-[0.82rem] leading-relaxed text-subtle">
                        {layer.blurb}
                    </p>
                )}
            </div>
        </div>

        <div className="flex flex-wrap content-start gap-2 md:col-span-7">
            {layer.items.map((item) => (
                <Chip key={item.name} item={item} />
            ))}
        </div>
    </Reveal>
);

const Skills = () => (
    <Section
        id="skills"
        index="03"
        eyebrow="Toolkit"
        title="The stack, layer by layer"
        intro="Grouped the way data moves through a platform rather than as a flat keyword list. Filled chips are tools I have owned in production."
        tone="canvas"
        curved
    >
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-subtle">
            <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo" />
                Production ownership
            </span>
            <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border border-line-strong" />
                Working familiarity
            </span>
        </div>

        <ol className="border-b border-line">
            {skillLayers.map((layer, index) => (
                <Layer key={layer.layer} layer={layer} index={index} />
            ))}
        </ol>

        {exploring?.items?.length > 0 && (
            <Reveal className="mt-8 rounded-2xl border border-dashed border-line-strong p-5">
                <h3 className="label text-subtle">{exploring.layer}</h3>
                {exploring.blurb && (
                    <p className="mt-2 text-[0.82rem] leading-relaxed text-subtle">
                        {exploring.blurb}
                    </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                    {exploring.items.map((item) => (
                        <span
                            key={item.name}
                            className="rounded-full border border-dashed border-line-strong px-3 py-1.5 font-mono text-[0.7rem] text-subtle"
                        >
                            {item.name}
                        </span>
                    ))}
                </div>
            </Reveal>
        )}
    </Section>
);

export default Skills;
