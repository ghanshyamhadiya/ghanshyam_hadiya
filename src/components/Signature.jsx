import React from 'react';
import { cn } from '../utils/cn';
import { profile } from '../data';

// Handwritten signature, set in Caveat rather than shipped as an image.
//
// Text means it scales, recolours, stays selectable and costs nothing extra —
// the handwriting face is already loaded for the annotations. An SVG signature
// asset would be more authentic, so the component takes an optional `src` if
// one ever gets supplied.
const Signature = ({ className, size = 'text-4xl sm:text-5xl', src }) => {
    if (src) {
        return (
            <img
                src={src}
                alt={`${profile.name}'s signature`}
                className={cn('h-auto w-40', className)}
            />
        );
    }

    return (
        <span
            className={cn('font-hand leading-none', size, className)}
            // The rendered text is decorative duplication of the name that is
            // already announced elsewhere in the section.
            aria-hidden="true"
        >
            {profile.signature}
        </span>
    );
};

// Small handwritten aside, the way the reference site annotates its layouts.
export const Annotation = ({ children, className, rotate = -6 }) => (
    <span
        className={cn('font-hand text-xl leading-tight sm:text-2xl', className)}
        style={{ display: 'inline-block', transform: `rotate(${rotate}deg)` }}
    >
        {children}
    </span>
);

export default Signature;
