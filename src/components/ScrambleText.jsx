import React, { useEffect, useRef } from 'react';
import useScramble from '../hooks/useScramble';

// Decodes its text when it scrolls into view, and again on hover when
// `rescanOnHover` is set. The real string stays in the DOM for assistive tech
// while the scrambled version is shown visually, so a screen reader never
// reads gibberish.
const ScrambleText = ({
    text,
    as: Tag = 'span',
    className,
    rescanOnHover = false,
    speed,
    ...rest
}) => {
    const ref = useRef(null);
    const { output, run } = useScramble(text, speed ? { speed } : undefined);

    useEffect(() => {
        const element = ref.current;
        if (!element) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                run();
            },
            { threshold: 0.3 }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [run]);

    return (
        <Tag
            ref={ref}
            className={className}
            onMouseEnter={rescanOnHover ? run : undefined}
            {...rest}
        >
            <span aria-hidden="true">{output || '\u00a0'}</span>
            <span className="sr-only">{text}</span>
        </Tag>
    );
};

export default ScrambleText;
