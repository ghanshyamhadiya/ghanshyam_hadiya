import React from 'react';
import { cn } from '../utils/cn';
import Reveal from './Reveal';

// Rounded card. The workhorse container for evidence sections: a white surface
// on the cream canvas, lifting slightly on hover.
//
// Deliberately plain. Decoration lives in the identity sections; here the job
// is to make content legible and scannable.
const TONES = {
    surface: 'bg-surface border-line',
    canvas: 'bg-canvas border-line',
    soft: 'bg-amber-soft border-transparent',
    amber: 'bg-amber border-transparent',
    indigo: 'bg-indigo text-canvas border-transparent',
    outline: 'bg-transparent border-line-strong',
};

const Panel = ({
    children,
    className,
    tone = 'surface',
    hover = true,
    delay = 0,
    as = 'div',
    ...rest
}) => (
    <Reveal
        as={as}
        delay={delay}
        className={cn(
            'group relative rounded-2xl border',
            TONES[tone] ?? TONES.surface,
            hover &&
                'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(20,18,37,0.35)]',
            className
        )}
        {...rest}
    >
        {children}
    </Reveal>
);

export default Panel;
