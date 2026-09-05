import React, { useId } from 'react';
import { cn } from '../utils/cn';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Organic decorative shapes.
//
// SVG paths rather than border-radius percentages: percentages distort as the
// element's aspect ratio changes, while a path with preserveAspectRatio="none"
// stretches predictably and stays crisp at any scale.
//
// Purely decorative — always aria-hidden, never a background for text. Text
// over a moving shape is the fastest way to make a colourful site unreadable.
const PATHS = [
    // Soft four-lobed
    'M46.8,-58.6C59.4,-49.1,67.3,-33.1,70.6,-16.5C73.9,0.1,72.6,17.3,65.2,31.3C57.8,45.3,44.3,56.1,29.2,62.4C14.1,68.7,-2.6,70.5,-18.6,66.4C-34.6,62.3,-49.9,52.3,-59.6,38.4C-69.3,24.6,-73.4,6.8,-70.3,-9.4C-67.2,-25.6,-56.9,-40.3,-43.6,-49.9C-30.3,-59.5,-15.2,-64,1.4,-65.7C17.9,-67.4,35.9,-66.3,46.8,-58.6Z',
    // Wide and low
    'M54.7,-63.2C69.3,-53.4,78.2,-34.5,79.9,-15.4C81.6,3.7,76.1,23,65.3,37.9C54.5,52.8,38.4,63.3,20.7,68.9C3,74.5,-16.3,75.2,-32.9,68.7C-49.5,62.2,-63.4,48.5,-70.8,32C-78.2,15.5,-79.1,-3.8,-73.3,-20.4C-67.5,-37,-55,-50.9,-40.4,-60.6C-25.8,-70.3,-9.1,-75.8,5.9,-72.9C20.9,-70,40,-73,54.7,-63.2Z',
    // Tall, leaning
    'M40.6,-52.7C52.1,-43.3,60.3,-30.3,64.8,-15.7C69.3,-1.1,70.1,15.1,63.7,27.8C57.3,40.5,43.7,49.7,29.4,56.3C15.1,62.9,0.1,66.9,-14.9,64.7C-29.9,62.5,-44.9,54.1,-55.2,41.5C-65.5,28.9,-71.1,12.1,-69.3,-3.6C-67.5,-19.3,-58.3,-33.9,-46.1,-43.6C-33.9,-53.3,-18.7,-58.1,-2.4,-55.2C13.9,-52.3,29.1,-62.1,40.6,-52.7Z',
    // Pebble
    'M63.4,-53.7C77.5,-38.7,80.7,-13.4,74.8,7.9C68.9,29.2,53.9,46.5,35.9,56.7C17.9,66.9,-3.1,70,-22.9,64.5C-42.7,59,-61.3,44.9,-69.4,26.1C-77.5,7.3,-75.1,-16.2,-64.1,-33.4C-53.1,-50.6,-33.5,-61.5,-13.9,-64.3C5.7,-67.1,49.3,-68.7,63.4,-53.7Z',
];

const Blob = ({
    variant = 0,
    className,
    color = 'currentColor',
    drift = true,
    duration = 18,
    delay = 0,
    opacity = 1,
}) => {
    const id = useId();
    const reducedMotion = usePrefersReducedMotion();
    const path = PATHS[variant % PATHS.length];

    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="-100 -100 200 200"
            preserveAspectRatio="none"
            className={cn('pointer-events-none absolute', className)}
            style={
                reducedMotion || !drift
                    ? { opacity }
                    : {
                          opacity,
                          animation: `drift ${duration}s ease-in-out ${delay}s infinite`,
                          willChange: 'transform',
                      }
            }
        >
            <path id={id} d={path} fill={color} />
        </svg>
    );
};

export default Blob;
