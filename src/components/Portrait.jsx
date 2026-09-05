import React from 'react';
import { cn } from '../utils/cn';

// Photo in a shaped frame.
//
// The source shot has a busy office-corridor background, so every placement
// gets a rounded mask plus an indigo colour wash. That reads as a designed
// element rather than a snapshot dropped into the layout, and it ties the
// photo to the palette — the navy shirt already sits close to the indigo.
//
// width/height are always emitted so the browser reserves the box and the
// surrounding layout never shifts as the image decodes.
const Portrait = ({ photo, className, imgClassName, wash = true, rounded = 'rounded-2xl' }) => {
    if (!photo) return null;

    return (
        <div className={cn('relative overflow-hidden', rounded, className)}>
            <img
                src={photo.src}
                srcSet={photo.srcSet}
                sizes={photo.sizes ?? '(max-width: 768px) 60vw, 30vw'}
                width={photo.width}
                height={photo.height}
                alt={photo.alt}
                loading={photo.eager ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={photo.eager ? 'high' : undefined}
                className={cn('h-full w-full object-cover', imgClassName)}
            />

            {wash && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-indigo/20 mix-blend-multiply"
                />
            )}
        </div>
    );
};

export default Portrait;
