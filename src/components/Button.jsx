import React from 'react';
import { cn } from '../utils/cn';

// Pill button.
//
// Colour rules are baked in rather than left to call sites, because one of
// them is a real accessibility trap: white text on hot pink measures 3.60 and
// fails AA. The `pink` variant therefore uses INK text, and `pinkDeep` exists
// for the cases that genuinely need white. See scripts/check-contrast.mjs.
const VARIANTS = {
    pink: 'bg-pink text-ink hover:bg-pink-deep hover:text-surface',
    indigo: 'bg-indigo text-canvas hover:bg-indigo-deep',
    ink: 'bg-ink text-canvas hover:bg-indigo',
    outline: 'border-2 border-ink text-ink hover:bg-ink hover:text-canvas',
    outlineInvert: 'border-2 border-canvas/40 text-canvas hover:bg-canvas hover:text-indigo',
};

const SIZES = {
    sm: 'px-4 py-2 text-[0.8rem]',
    md: 'px-6 py-3 text-[0.9rem]',
    lg: 'px-7 py-4 text-[0.95rem]',
};

const Button = ({
    as = 'button',
    variant = 'pink',
    size = 'md',
    className,
    children,
    icon,
    ...rest
}) => {
    const Component = as;

    return (
        <Component
            className={cn(
                'group inline-flex items-center justify-center gap-2.5 rounded-md font-display font-semibold',
                'transition-all duration-300 ease-out active:scale-[0.97]',
                VARIANTS[variant] ?? VARIANTS.pink,
                SIZES[size] ?? SIZES.md,
                className
            )}
            {...rest}
        >
            {children}
            {icon && (
                <span className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1">
                    {icon}
                </span>
            )}
        </Component>
    );
};

export default Button;
