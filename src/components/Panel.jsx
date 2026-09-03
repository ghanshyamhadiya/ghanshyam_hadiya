import React from 'react';
import { cn } from '../utils/cn';
import Reveal from './Reveal';

// Hard-edged container with optional corner brackets and a scanline sweep on
// hover. Structure comes from a 1px rule and four corner marks rather than a
// radius.
//
// Note: avoid writing the literal utility name for a corner radius anywhere in
// src. Tailwind scans raw file text, comments included, so merely mentioning it
// makes it generate that utility and reintroduces a curve into the bundle.
const Bracket = ({ className }) => (
    <span
        aria-hidden="true"
        className={cn(
            'pointer-events-none absolute h-2.5 w-2.5 border-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100',
            className
        )}
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
}) => (
    <Reveal
        as={as}
        delay={delay}
        className={cn(
            'group relative border border-line bg-surface/70',
            hover && 'transition-colors duration-300 hover:border-accent/45 hover:bg-surface-2/80',
            className
        )}
        {...rest}
    >
        {brackets && (
            <>
                <Bracket className="-left-px -top-px border-l border-t" />
                <Bracket className="-right-px -top-px border-r border-t" />
                <Bracket className="-bottom-px -left-px border-b border-l" />
                <Bracket className="-bottom-px -right-px border-b border-r" />
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
    </Reveal>
);

export default Panel;
