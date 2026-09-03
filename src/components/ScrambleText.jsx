import React, { useEffect } from 'react';
import useScramble from '../hooks/useScramble';
import useReveal from '../hooks/useReveal';

// Decodes its text when it scrolls into view, and again on hover when
// `rescanOnHover` is set.
//
// Visibility comes from the shared reveal system rather than a private
// observer, so it can never be left mid-scramble if a trigger is missed — the
// same fail-safes that guarantee every other reveal apply here.
//
// The real string stays in the DOM for assistive tech while the scrambled
// version is shown visually, so a screen reader never reads gibberish.
const ScrambleText = ({
    text,
    as: Tag = 'span',
    className,
    rescanOnHover = false,
    speed,
    ...rest
}) => {
    const [ref, visible] = useReveal();
    const { output, run } = useScramble(text, speed ? { speed } : undefined);

    useEffect(() => {
        if (visible) run();
    }, [visible, run]);

    return (
        <Tag
            ref={ref}
            className={className}
            onMouseEnter={rescanOnHover ? run : undefined}
            {...rest}
        >
            <span aria-hidden="true">{output || text}</span>
            <span className="sr-only">{text}</span>
        </Tag>
    );
};

export default ScrambleText;
