import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

// Shared eyebrow + masked heading used by About, Skills, Experience and Projects.
const SectionHeading = ({ eyebrow, title, className, align = 'left', id }) => (
    <div className={cn('flex flex-col gap-4', align === 'right' && 'items-end text-right', className)} id={id}>
        {eyebrow && (
            <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="flex items-center gap-3 text-[0.7rem] sm:text-xs font-bold uppercase tracking-[0.35em] text-white/50"
            >
                <span className="h-px w-8 bg-white/30" aria-hidden="true" />
                {eyebrow}
            </motion.span>
        )}

        <span className="block overflow-hidden">
            <motion.h2
                initial={{ y: '110%' }}
                whileInView={{ y: '0%' }}
                viewport={viewport}
                transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
                className="text-[2.6rem] leading-[0.9] sm:text-6xl md:text-7xl font-black uppercase tracking-tighter"
            >
                {title}
            </motion.h2>
        </span>
    </div>
);

export default SectionHeading;
