import React, { Fragment, useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import useGlideProgress from '../../hooks/useGlideProgress';

const VARIANTS = ['opposed', 'steps', 'layers', 'unfold', 'connect', 'press', 'converge'];

const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const wordPose = (variant, value, index, count) => {
    const order = count > 1 ? index / (count - 1) : 0;
    const delay = order * (variant === 'steps' || variant === 'connect' ? 0.24 : 0.18);
    const amount = smooth((value - delay) / 0.7);
    const rest = 1 - amount;
    const direction = index % 2 ? 1 : -1;
    let transform = 'none';
    let clipPath = 'inset(0% 0% 0% 0%)';
    if (rest > 0) {
        if (variant === 'opposed') transform = `translate3d(${direction * rest * 105}%,0,0)`;
        else if (variant === 'steps') transform = `translate3d(0,${rest * 115}%,0) rotate(${direction * rest * 12}deg)`;
        else if (variant === 'layers') transform = `translate3d(${direction * rest * 22}%,${rest * 100}%,0)`;
        else if (variant === 'unfold') transform = `perspective(800px) translate3d(0,${rest * 30}%,0) rotateX(${-rest * 85}deg)`;
        else if (variant === 'connect') { transform = `translate3d(${-rest * 18}%,0,0)`; clipPath = `inset(0% ${rest * 100}% 0% 0%)`; }
        else if (variant === 'press') transform = `translate3d(0,${-rest * 12}%,0) rotate(${-rest * 14}deg) scale(${1 - rest * 0.5})`;
        else if (variant === 'converge') transform = `scale(${1 - rest * 0.14})`;
    }
    return {
        transform,
        clipPath,
        opacity: variant === 'press' ? 0.15 + 0.85 * amount : 0.35 + 0.65 * amount,
        echoTransform: `translate3d(${-direction * rest * 16}%,${rest * 35}%,0)`,
        echoOpacity: rest * 0.28,
        lineScale: amount,
    };
};

const Letter = ({ char, index, total, progress, reduced }) => {
    const middle = (total - 1) / 2;
    const distance = Math.abs(index - middle) / Math.max(1, middle);
    const amount = useTransform(progress, (p) => smooth((p - distance * 0.18) / 0.64));
    const transform = useTransform(amount, (a) => a === 1 ? 'none' : `perspective(600px) translate3d(${(index - middle) * 0.08 * (1 - a)}em,${(0.35 + distance * 0.7) * (1 - a)}em,0) rotateY(${(index < middle ? -75 : 75) * (1 - a)}deg) rotate(${(index % 2 ? -10 : 10) * (1 - a)}deg)`);
    const opacity = useTransform(amount, (a) => 0.2 + 0.8 * a);
    return (
        <motion.span
            data-heading-letter
            className="inline-block"
            style={reduced ? undefined : { transform, opacity, transformOrigin: '50% 100%' }}
        >
            {char}
        </motion.span>
    );
};

const Word = ({ word, index, count, progress, reduced, variant, letterStart, totalLetters }) => {
    const state = useTransform(progress, (value) => wordPose(variant, value, index, count));
    const transform = useTransform(state, (s) => s.transform);
    const opacity = useTransform(state, (s) => s.opacity);
    const clipPath = useTransform(state, (s) => s.clipPath);
    const echoTransform = useTransform(state, (s) => s.echoTransform);
    const echoOpacity = useTransform(state, (s) => s.echoOpacity);
    const lineScale = useTransform(state, (s) => s.lineScale);
    const origin = variant === 'unfold' || variant === 'steps' ? '50% 100%' : '50% 50%';
    return (
        <span data-heading-mask className="relative inline-block overflow-hidden align-bottom pb-[0.12em]">
            {variant === 'layers' && !reduced && (
                <motion.span
                    data-heading-echo
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 inline-block text-current"
                    style={{ transform: echoTransform, opacity: echoOpacity }}
                >
                    {word}
                </motion.span>
            )}
            <motion.span
                data-editorial-word
                className="relative inline-block"
                style={reduced ? undefined : { transform, opacity, clipPath, transformOrigin: origin }}
            >
                {variant === 'converge'
                    ? [...word].map((char, i) => (
                        <Letter key={`${char}-${i}`} char={char} index={letterStart + i} total={totalLetters} progress={progress} reduced={reduced} />
                    ))
                    : word}
            </motion.span>
            {variant === 'connect' && (
                <motion.span
                    data-heading-underline
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-current"
                    style={{ scaleX: reduced ? 1 : lineScale }}
                />
            )}
        </span>
    );
};

const EditorialHeading = ({ id, text, variant = 'opposed', className = '' }) => {
    const ref = useRef(null);
    const { progress, reducedMotion } = useGlideProgress(ref, ['start 95%', 'start 50%']);
    const motionVariant = VARIANTS.includes(variant) ? variant : 'opposed';
    const words = text.split(' ');
    const totalLetters = words.reduce((sum, word) => sum + word.length, 0);
    const letterStarts = [];
    words.reduce((start, word) => { letterStarts.push(start); return start + word.length; }, 0);
    return (
        <h2 id={id} ref={ref} data-editorial-heading data-heading-motion={motionVariant} className={`editorial-heading ${className}`}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {words.map((word, index) => (
                    <Fragment key={`${word}-${index}`}>
                        {index > 0 && ' '}
                        <Word
                            word={word}
                            index={index}
                            count={words.length}
                            progress={progress}
                            reduced={reducedMotion}
                            variant={motionVariant}
                            letterStart={letterStarts[index]}
                            totalLetters={totalLetters}
                        />
                    </Fragment>
                ))}
            </span>
        </h2>
    );
};

export default EditorialHeading;
