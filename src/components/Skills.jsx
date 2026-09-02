import React from 'react';
import { motion } from 'framer-motion';
import Section from './Section';
import { cn } from '../utils/cn';
import { skillLayers, exploring } from '../data';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

const Chip = ({ item }) => (
    <span
        className={cn(
            'rounded-full border px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.04em] transition-colors duration-300',
            item.primary
                ? 'border-accent/40 bg-accent-soft text-accent'
                : 'border-line text-muted hover:border-line-strong hover:text-ink'
        )}
    >
        {item.name}
    </span>
);

const Layer = ({ layer, index }) => (
    <motion.li
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.05, ease: EASE_OUT_EXPO }}
        className="grid gap-4 py-7 md:grid-cols-12 md:gap-8"
    >
        <div className="flex gap-4 md:col-span-5">
            <span className="mt-1 font-mono text-[0.7rem] text-subtle tabular-nums">
                {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
                <h3 className="font-display text-xl leading-tight text-ink sm:text-2xl">
                    {layer.layer}
                </h3>
                {layer.blurb && (
                    <p className="mt-1.5 text-[0.8rem] leading-relaxed text-subtle">
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
    </motion.li>
);

// Skills grouped by layer of the data stack, in the order data flows through
// it — so the section reads like a platform diagram rather than a keyword list.
// Deliberately no proficiency percentages; depth is conveyed by the `primary`
// highlight and by what the project section actually demonstrates.
const Skills = () => (
    <Section
        id="skills"
        eyebrow="Toolkit"
        title="The stack, layer by layer"
        intro="Grouped the way data moves through a platform rather than as a flat keyword list. Highlighted entries are tools I have owned in production."
    >
        {/* Legend, so the accent highlight is unambiguous rather than decorative. */}
        <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-subtle">
            <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full border border-accent/40 bg-accent-soft" />
                Production ownership
            </span>
            <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full border border-line" />
                Working familiarity
            </span>
        </div>

        <ol className="divide-y divide-line border-y border-line">
            {skillLayers.map((layer, index) => (
                <Layer key={layer.layer} layer={layer} index={index} />
            ))}
        </ol>

        {exploring?.items?.length > 0 && (
            <div className="mt-10 rounded-xl border border-dashed border-line-strong p-5 sm:p-6">
                <h3 className="label text-subtle">{exploring.layer}</h3>
                {exploring.blurb && (
                    <p className="mt-2 text-[0.8rem] leading-relaxed text-subtle">
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
            </div>
        )}
    </Section>
);

export default Skills;
