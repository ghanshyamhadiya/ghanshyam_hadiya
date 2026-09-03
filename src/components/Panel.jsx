import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { EASE_OUT_EXPO, viewport } from '../utils/motion';

// Hard-edged container with optional corner brackets and a scanline sweep on
// reveal. Replaces the soft-cornered card of the previous design — structure
// now comes from a 1px rule and four corner marks rather than a radius.
//
// Note: avoid writing the literal utility name for a corner radius anywhere in
// src. Tailwind scans raw file text, comments included, so merely mentioning it
// makes it generate that utility and reintroduces a curve into the bundle.
const Bracket = ({ className }) => (
    <span
        aria-hidden="true"
        className={cn('pointer-events-none absolute h-2.5 w-2.5 border-accent', className)}
    />
);

const Panel = ({
    children,
    className,
    brackets = true,
    scan = true,
    hover = true,
    delay = 0,
    as = 'div',
    ...rest
}) => {
    const Component = motion[as] ?? motion.div;

    return (
        <Component
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55, delay, ease: EASE_OUT_EXPO }}
            className={cn(
                'group relative border border-line bg-surface/70',
                hover && 'transition-colors duration-300 hover:border-accent/45 hover:bg-surface-2/80',
                className
            )}
            {...rest}
        >
            {brackets && (
                <>
                    <Bracket className="-left-px -top-px border-l border-t opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <Bracket className="-right-px -top-px border-r border-t opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <Bracket className="-bottom-px -left-px border-b border-l opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <Bracket className="-bottom-px -right-px border-b border-r opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </>
            )}

            {scan && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100"
                >
                    <span className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-accent/[0.07] to-transparent group-hover:animate-[scan_1.4s_ease-in-out]" />
                </span>
            )}

            {children}
        </Component>
    );
};

export default Panel;
