import React from 'react';
import { cn } from '../utils/cn';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Spiky sunburst badge, the shape the reference site pins to its award cards.
//
// The polygon is generated rather than hand-drawn so the point count and
// spikiness can change without redrawing a path: vertices alternate between an
// outer and an inner radius around the circle.
const points = (count, outer, inner) =>
    Array.from({ length: count * 2 }, (_, i) => {
        const radius = i % 2 === 0 ? outer : inner;
        // -90deg so a point sits at the top rather than the right.
        const angle = (Math.PI / count) * i - Math.PI / 2;
        return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(
            50 +
            radius * Math.sin(angle)
        ).toFixed(2)}`;
    }).join(' ');

const Starburst = ({
    label,
    size = 64,
    spikes = 14,
    fill = 'var(--color-pink)',
    textClass = 'fill-[color:var(--color-ink)]',
    className,
    spin = true,
}) => {
    const reducedMotion = usePrefersReducedMotion();

    return (
        <span
            className={cn('pointer-events-none inline-flex select-none', className)}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 100 100"
                width={size}
                height={size}
                role="img"
                aria-label={label ? `${label}` : undefined}
                aria-hidden={label ? undefined : 'true'}
            >
                <g
                    style={
                        reducedMotion || !spin
                            ? undefined
                            : {
                                  transformOrigin: '50% 50%',
                                  animation: 'spin-slow 26s linear infinite',
                              }
                    }
                >
                    <polygon points={points(spikes, 48, 38)} fill={fill} />
                </g>

                {label && (
                    <text
                        x="50"
                        y="50"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={cn('font-display', textClass)}
                        style={{ fontSize: 26, fontWeight: 800 }}
                    >
                        {label}
                    </text>
                )}
            </svg>
        </span>
    );
};

export default Starburst;
