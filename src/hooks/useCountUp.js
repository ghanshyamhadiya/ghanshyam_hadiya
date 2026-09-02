import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery';

// Splits "TODO: 40M+" into { before: 'TODO: ', number: 40, after: 'M+' } so the
// numeric part can animate while any prefix/suffix stays intact. Returns null
// when there is nothing numeric to animate.
function parse(text) {
    const source = String(text);
    const match = source.match(/\d[\d.,]*/);
    if (!match) return null;

    const raw = match[0];
    const target = Number.parseFloat(raw.replace(/,/g, ''));
    if (!Number.isFinite(target)) return null;

    return {
        before: source.slice(0, match.index),
        after: source.slice(match.index + raw.length),
        decimals: raw.includes('.') ? raw.split('.')[1].length : 0,
        target,
    };
}

// Counts a value up once it scrolls into view, preserving surrounding
// characters. State holds the animated *number* rather than a formatted string,
// so formatting happens during render and the effect never needs a synchronous
// setState to fall back to the raw text.
export function useCountUp(text, { duration = 1400 } = {}) {
    const ref = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    const parsed = useMemo(() => parse(text), [text]);
    const [value, setValue] = useState(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !parsed || reducedMotion) return undefined;

        let frame = 0;
        let start = 0;

        const step = (now) => {
            if (!start) start = now;
            const progress = Math.min((now - start) / duration, 1);
            // easeOutExpo, matching the site's motion language.
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setValue(parsed.target * eased);
            if (progress < 1) frame = requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                frame = requestAnimationFrame(step);
            },
            { threshold: 0.4 }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [parsed, duration, reducedMotion]);

    const display =
        parsed && value !== null
            ? `${parsed.before}${value.toFixed(parsed.decimals)}${parsed.after}`
            : text;

    return [ref, display];
}

export default useCountUp;
