import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}=+*#%$&';

// Decodes text character by character: each position cycles through random
// glyphs until its "settle" frame, then locks to the real character.
//
// Runs on a single rAF loop writing to a ref-held string, and only calls
// setState once per frame with the composed output.
export function useScramble(text, { speed = 1.6, revealAt = 0.35 } = {}) {
    const reducedMotion = usePrefersReducedMotion();
    const [output, setOutput] = useState(reducedMotion ? text : '');
    const frame = useRef(0);
    const raf = useRef(0);

    const run = useCallback(() => {
        if (reducedMotion) {
            setOutput(text);
            return;
        }

        cancelAnimationFrame(raf.current);
        frame.current = 0;

        // Each character settles at a staggered frame, so the string resolves
        // left to right rather than all at once.
        const settleAt = [...text].map((_, i) => i * (1 / revealAt) * 0.5 + Math.random() * 8);
        const total = Math.max(...settleAt, 1) + 6;

        const tick = () => {
            const f = frame.current;

            const next = [...text]
                .map((char, i) => {
                    if (char === ' ') return ' ';
                    if (f >= settleAt[i]) return char;
                    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                })
                .join('');

            setOutput(next);

            if (f < total) {
                frame.current = f + speed;
                raf.current = requestAnimationFrame(tick);
            } else {
                setOutput(text);
            }
        };

        raf.current = requestAnimationFrame(tick);
    }, [text, speed, revealAt, reducedMotion]);

    useEffect(() => cancelAnimationFrame.bind(null, raf.current), []);

    return { output, run };
}

export default useScramble;
