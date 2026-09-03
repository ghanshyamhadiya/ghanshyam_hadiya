import React from 'react';
import Section from './Section';
import Reveal from './Reveal';
import { cn } from '../utils/cn';
import { skillLayers, exploring } from '../data';
import { stagger } from '../utils/motion';

const Chip = ({ item }) => (
    <span
        className={cn(
            'border px-2.5 py-1.5 font-mono text-[0.68rem] tracking-[0.03em] transition-colors duration-200',
            item.primary
                ? 'border-accent/45 bg-accent-soft text-accent hover:bg-accent hover:text-bg'
                : 'border-line text-muted hover:border-line-strong hover:text-ink'
        )}
    >
        {item.name}
    </span>
);

const Layer = ({ layer, index }) => (
    <Reveal
        as="li"
        delay={stagger(index)}
        className="group relative grid gap-3.5 border-t border-line py-5 transition-colors duration-300 hover:bg-surface/60 sm:py-6 md:grid-cols-12 md:gap-8"
    >
        {/* Rule that draws itself across the row on hover */}
        <span
            aria-hidden="true"
            className="absolute left-0 top-0 h-px w-0 bg-accent transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
        />

        <div className="flex gap-4 md:col-span-5">
            <span className="mt-1 font-mono text-[0.65rem] text-subtle tabular-nums">
                {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
                <h3 className="font-display text-base leading-tight text-ink sm:text-lg">
                    {layer.layer}
                </h3>
                {layer.blurb && (
                    <p className="mt-1.5 text-[0.78rem] leading-relaxed text-subtle">
                        {layer.blurb}
                    </p>
                )}
            </div>
        </div>

        <div className="flex flex-wrap content-start gap-1.5 md:col-span-7">
            {layer.items.map((item) => (
                <Chip key={item.name} item={item} />
            ))}
        </div>
    </Reveal>
);

// Skills grouped by layer of the data stack, in the order data flows through
// it, so the section reads like a platform diagram rather than a keyword list.
// No proficiency percentages: depth is signalled by `primary`, and by what the
// project section actually demonstrates.
const Skills = () => (
    <Section
        id="skills"
        index="02"
        eyebrow="Toolkit"
        title="The stack, layer by layer"
        intro="Grouped the way data moves through a platform rather than as a flat keyword list. Highlighted entries are tools I have owned in production."
    >
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-subtle">
            <span className="flex items-center gap-2">
                <span className="h-2 w-2 border border-accent/45 bg-accent-soft" />
                Production ownership
            </span>
            <span className="flex items-center gap-2">
                <span className="h-2 w-2 border border-line" />
                Working familiarity
            </span>
        </div>

        <ol className="border-b border-line">
            {skillLayers.map((layer, index) => (
                <Layer key={layer.layer} layer={layer} index={index} />
            ))}
        </ol>

        {exploring?.items?.length > 0 && (
            <div className="hatch mt-10 border border-dashed border-line-strong p-5">
                <h3 className="label text-subtle">{exploring.layer}</h3>
                {exploring.blurb && (
                    <p className="mt-2 text-[0.78rem] leading-relaxed text-subtle">
                        {exploring.blurb}
                    </p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {exploring.items.map((item) => (
                        <span
                            key={item.name}
                            className="border border-dashed border-line-strong px-2.5 py-1.5 font-mono text-[0.68rem] text-subtle"
                        >
                            {item.name}
                        </span>
                    ))}
                </div>
            </div>
        )}
    </Section>
);

export default Skills;
