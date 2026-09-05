import React from 'react';
import { cn } from '../utils/cn';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Wireframe globe, the recurring decorative mark from the HOBRO contact panel.
//
// Built from ellipses rather than a mesh: rotating the whole SVG while the
// inner ellipses stay put reads convincingly as a turning sphere, for a
// fraction of the cost of real 3D.
const WireGlobe = ({ className, size = 120, stroke = 'currentColor', spin = true }) => {
    const reducedMotion = usePrefersReducedMotion();

    // Longitude lines: successively narrower ellipses.
    const longitudes = [1, 0.72, 0.42, 0.14];
    // Latitude lines: flattened ellipses at descending offsets.
    const latitudes = [-0.55, -0.28, 0, 0.28, 0.55];

    return (
        <svg
            aria-hidden="true"
            focusable="false"
            width={size}
            height={size}
            viewBox="-52 -52 104 104"
            className={cn('pointer-events-none', className)}
            style={
                reducedMotion || !spin
                    ? undefined
                    : { animation: 'spin-slow 38s linear infinite', willChange: 'transform' }
            }
        >
            <g fill="none" stroke={stroke} strokeWidth="0.8" opacity="0.7">
                <circle r="46" />
                {longitudes.map((rx) => (
                    <ellipse key={`lo-${rx}`} rx={46 * rx} ry="46" />
                ))}
                {latitudes.map((offset) => (
                    <ellipse
                        key={`la-${offset}`}
                        cy={46 * offset}
                        rx={46 * Math.sqrt(Math.max(0, 1 - offset * offset))}
                        ry={46 * 0.12}
                    />
                ))}
            </g>
        </svg>
    );
};

export default WireGlobe;
