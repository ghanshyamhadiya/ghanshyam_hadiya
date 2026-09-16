import React, { useEffect, useRef, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import useGlideProgress from '../../hooks/useGlideProgress';
import SplitText from './SplitText';
import { cn } from '../../utils/cn';

const smooth = (value) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
};

const pose = (variant, value, index, count) => {
    const order = count > 1 ? index / (count - 1) : 0;
    const arrival = smooth((value - order * 0.06) / 0.35);
    const incoming = 1 - arrival;
    const outgoing = smooth((value - 0.71 - order * 0.05) / 0.24);
    const direction = index < Math.ceil(count / 2) ? -1 : 1;
    let x = 0;
    let y = 0;
    let rotation = 0;
    let rotateX = 0;
    let scaleX = 1;
    let scaleY = 1;

    if (variant === 'opposed') {
        x = direction * (incoming * 0.18 - outgoing * 0.18);
        rotation = direction * (incoming * 1.1 - outgoing * 1.1);
    } else if (variant === 'layers') {
        x = (index % 2 ? 1 : -1) * incoming * 0.06;
        y = incoming * (0.18 + order * 0.06) - outgoing * (0.18 + order * 0.04);
        rotation = incoming * (index % 2 ? 0.8 : -0.8);
    } else if (variant === 'unfold') {
        y = incoming * 0.16 - outgoing * 0.16;
        rotateX = incoming * 28 - outgoing * 24;
        x = order * (incoming - outgoing) * 0.045;
    } else if (variant === 'connect') {
        x = incoming * (index ? 0.16 : -0.16) + outgoing * 0.18;
        y = incoming * 0.05;
        scaleX = 1 - incoming * 0.055;
    } else if (variant === 'press') {
        scaleX = scaleY = 1 - incoming * 0.09 - outgoing * 0.07;
        rotation = incoming * -1.2 + outgoing * 0.9;
        y = -incoming * 0.16 - outgoing * 0.12;
    } else if (variant === 'converge') {
        const recoil = Math.sin(arrival * Math.PI) * (1 - arrival) * 0.025;
        x = direction * (incoming * 0.18 - outgoing * 0.18 - recoil);
        scaleX = 1 - incoming * 0.1 + recoil - outgoing * 0.065;
        rotation = direction * (incoming * -0.8 + outgoing * 0.8);
    }

    return {
        opacity: arrival * (1 - outgoing),
        transform: incoming === 0 && outgoing === 0 ? 'none' :
            `${rotateX ? 'perspective(1000px) ' : ''}translate3d(${x}em, ${y}em, 0) rotate(${rotation}deg) rotateX(${rotateX}deg) scale(${scaleX}, ${scaleY})`,
    };
};

const MovingWord = ({ index, count, props, variant, progress }) => {
    const state = useTransform(progress, (value) => pose(variant, value, index, count));
    const transform = useTransform(state, (value) => value.transform);
    const opacity = useTransform(state, (value) => value.opacity);

    return (
        <motion.span
            {...props}
            data-heading-word=""
            style={{
                ...props.style,
                transform,
                opacity,
                transformOrigin: variant === 'unfold' ? '50% 100%' : '50% 65%',
            }}
        />
    );
};

const HeadingGraphic = ({ variant, progress }) => {
    const amount = useTransform(progress, (value) => smooth(value / 0.42) * (1 - smooth((value - 0.72) / 0.28)));
    if (variant !== 'connect' && variant !== 'layers') return null;

    return variant === 'connect' ? (
        <motion.span
            data-heading-graphic="connect"
            className="pointer-events-none absolute inset-x-0 top-full mt-[0.12em] block h-px origin-left bg-current"
            style={{ scaleX: amount, opacity: amount }}
        >
            {[0, 50, 100].map((left) => (
                <span
                    key={left}
                    className="absolute top-1/2 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
                    style={{ left: left === 0 ? 4 : left === 100 ? 'calc(100% - 4px)' : '50%' }}
                />
            ))}
        </motion.span>
    ) : (
        <span data-heading-graphic="layers" className="pointer-events-none absolute left-0 top-full mt-[0.08em] flex w-[1.2em] flex-col gap-[0.045em]">
            {[1, 0.72, 0.44].map((width) => (
                <motion.span key={width} className="block h-px origin-left bg-current" style={{ width: `${width * 100}%`, scaleX: amount, opacity: 0.35 }} />
            ))}
        </span>
    );
};

const AnimatedHeading = ({ id, text, variant, className }) => {
    const ref = useRef(null);
    const { progress: scrollYProgress, reducedMotion } = useGlideProgress(ref);
    const [fontReady, setFontReady] = useState(false);
    const content = String(text ?? '');
    const enabled = fontReady && !reducedMotion;

    useEffect(() => {
        if (reducedMotion || !document.fonts) return undefined;
        let cancelled = false;
        const load = async () => {
            try {
                const family = getComputedStyle(ref.current).fontFamily.split(',')[0];
                const faces = await document.fonts.load(`800 96px ${family}`, content);
                if (!cancelled) setFontReady(faces.length > 0);
            } catch {
                return;
            }
        };
        load();
        return () => { cancelled = true; };
    }, [content, reducedMotion]);

    return (
        <h2
            ref={ref}
            id={id}
            data-heading-motion={variant}
            data-scroll-heading={enabled ? '' : undefined}
            className={cn('relative isolate w-full', className)}
            style={{
                fontSize: variant === 'converge' ? 'clamp(3.25rem, 11.5vw, 10.25rem)' : 'clamp(2.5rem, 7.5vw, 6.75rem)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.14,
                padding: '0.38em 0.28em',
            }}
        >
            <span className="sr-only">{content}</span>
            <span aria-hidden="true" data-scroll-heading-visual={enabled ? '' : undefined} className="relative block">
                {enabled ? (
                    <SplitText text={content} renderWord={(word) => (
                        <MovingWord {...word} variant={variant} progress={scrollYProgress} />
                    )} />
                ) : <SplitText text={content} />}
                {enabled && <HeadingGraphic variant={variant} progress={scrollYProgress} />}
            </span>
        </h2>
    );
};

export default AnimatedHeading;
