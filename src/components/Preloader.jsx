import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { profile } from '../data';
import SystemBackdrop from './SystemBackdrop';
import { shouldPlayIntro, introDuration, markIntroPlayed, setBooted, finishIntro } from '../utils/bootState';
import { EASE_GLIDE, INTRO_TIMING } from '../utils/motion';
import { useIntroComplete } from '../hooks/useBooted';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

// Intro curtain: indigo fills the screen, the name assembles at display scale,
// amber shapes sweep in from the corners, then the whole thing peels away.
//
// The point of this sequence is the brief. The site previously never said who
// it belonged to at any size worth noticing; now the first thing that happens
// is the name being written across the screen.
//
// Timing contract, enforced by scripts/audit-intro.mjs:
//   - setBooted() fires as the peel STARTS, not on unmount, so the hero
//     animates while the curtain is still moving and the two read as one.
//   - the whole sequence finishes under the shared INTRO_TIMING budget.
//
// Session-scoped, dismissible by click or key, skipped under reduced motion.

// Two lengths. The first load of a session plays in full so the name has time
// to land; every refresh after that plays a compressed version, because an
// intro you sit through on every reload stops being an introduction and starts
// being a toll gate.
const measure = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
        left: rect.left, top: rect.top, width: rect.width, height: rect.height,
        fontSize: parseFloat(style.fontSize), lineHeight: style.lineHeight,
        fontFamily: style.fontFamily, fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing, color: style.color,
        backgroundColor: style.backgroundColor,
    };
};

const NameFlight = ({ item, progress, tone, index }) => {
    const x = useTransform(progress, [0, 1], [item.from.left, item.to.left]);
    const y = useTransform(progress, (p) => item.from.top + (item.to.top - item.from.top) * p - Math.sin(p * Math.PI) * 20);
    const scale = useTransform(progress, [0, 1], [item.from.width / item.to.width, 1]);
    return (
        <motion.span
            data-intro-flight={index}
            data-flight-tone={tone}
            className="fixed left-0 top-0 block whitespace-nowrap"
            style={{
                x, y, scale, transformOrigin: '0% 0%', width: item.to.width, height: item.to.height,
                fontFamily: item.to.fontFamily, fontSize: item.to.fontSize,
                fontWeight: item.to.fontWeight, lineHeight: item.to.lineHeight,
                letterSpacing: item.to.letterSpacing, fontOpticalSizing: 'none', fontVariationSettings: '"opsz" 80',
                color: tone === 'light' ? 'var(--color-canvas)' : item.to.color,
            }}
        >
            {item.text}
        </motion.span>
    );
};

const MarkFlight = ({ item, progress, initials }) => {
    const x = useTransform(progress, [0, 1], [item.from.left, item.to.left]);
    const y = useTransform(progress, [0, 1], [item.from.top, item.to.top]);
    const width = useTransform(progress, [0, 1], [item.from.width, item.to.width]);
    const height = useTransform(progress, [0, 1], [item.from.height, item.to.height]);
    const fontSize = useTransform(progress, [0, 1], [item.from.fontSize, item.to.fontSize]);
    const backgroundColor = useTransform(progress, [0, 1], ['#332c81', item.to.backgroundColor]);
    const borderWidth = useTransform(progress, [0, 1], [2, 0]);
    return (
        <motion.span
            data-intro-flight-mark
            className="fixed left-0 top-0 flex items-center justify-center rounded-full border-solid border-canvas font-display text-canvas"
            style={{ x, y, width, height, fontSize, backgroundColor, borderWidth, fontWeight: item.to.fontWeight }}
        >
            {initials}
        </motion.span>
    );
};

const Preloader = () => {
    const [skip] = useState(() => !shouldPlayIntro());
    const [mode] = useState(() => introDuration());
    const complete = useIntroComplete();
    const reducedMotion = usePrefersReducedMotion();
    const [flight, setFlight] = useState(null);
    const starts = useRef([]);
    const mark = useRef(null);
    const finish = useRef(null);
    const progress = useMotionValue(0);
    const timing = INTRO_TIMING[mode];
    const initials = profile.nameLines.map((line) => line[0]).join('');
    const clipPath = useTransform(progress, (p) => {
        const t = Math.max(0, Math.min(1, (p - 0.08) / 0.82));
        const cut = t * t * (3 - 2 * t) * 100;
        return `inset(0px 0px ${cut}% 0px round 0px 0px ${t * 8}vh ${t * 8}vh)`;
    });

    useEffect(() => {
        if (reducedMotion) finishIntro();
        if (skip || complete || reducedMotion) return undefined;
        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        root.style.overflow = 'hidden';
        let finished = false;
        let started = false;
        let observer;
        let savedTargets = [];
        const done = () => {
            if (finished) return;
            finished = true;
            markIntroPlayed();
            finishIntro();
        };
        finish.current = done;
        const begin = () => {
            if (finished) return;
            const targets = [...document.querySelectorAll('[data-hero-name-target]')];
            const navMark = document.querySelector('[data-nav-mark]');
            if (targets.length !== profile.nameLines.length || !mark.current || !navMark || profile.nameLines.some((_, index) => !starts.current[index])) return done();
            const names = targets.map((target, index) => ({ text: profile.nameLines[index], from: measure(starts.current[index]), to: measure(target) }));
            if (names.some(({ from, to }) => from.width <= 0 || to.width <= 0)) return done();
            started = true;
            savedTargets = targets.map((element, i) => ({ element, rect: names[i].to }));
            setFlight({ names, mark: { from: measure(mark.current), to: measure(navMark) } });
            // Unblock the hero at the same moment the curtain begins to leave.
            setBooted();
            if (window.ResizeObserver) {
                observer = new ResizeObserver(() => {
                    if (savedTargets.some(({ element, rect }) => Math.abs(element.getBoundingClientRect().width - rect.width) > 1)) done();
                });
                targets.forEach((target) => observer.observe(target));
            }
        };
        const onResize = () => { if (started) done(); };
        const timer = window.setTimeout(begin, timing.hold);
        const failSafe = window.setTimeout(done, timing.budget);
        window.addEventListener('keydown', done);
        window.addEventListener('click', done);
        window.addEventListener('resize', onResize);
        return () => {
            finished = true;
            finish.current = null;
            root.style.overflow = previousOverflow;
            window.clearTimeout(timer);
            window.clearTimeout(failSafe);
            observer?.disconnect();
            window.removeEventListener('keydown', done);
            window.removeEventListener('click', done);
            window.removeEventListener('resize', onResize);
        };
    }, [skip, complete, reducedMotion, timing]);

    useLayoutEffect(() => {
        if (!flight || complete || reducedMotion) return undefined;
        let frame;
        let controls;
        progress.jump(0);
        frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => {
                controls = animate(progress, 1, {
                    duration: timing.handoff,
                    ease: EASE_GLIDE,
                    onComplete: () => { frame = requestAnimationFrame(() => finish.current?.()); },
                });
            });
        });
        return () => { controls?.stop(); cancelAnimationFrame(frame); };
    }, [flight, complete, reducedMotion, progress, timing]);

    if (skip || complete || reducedMotion) return null;

    return (
        <div data-intro-overlay data-intro-phase={flight ? 'handoff' : 'welcome'} aria-hidden="true" className="fixed inset-0 z-[9998] overflow-hidden">
            {flight?.names.map((item, index) => <NameFlight key={index} item={item} index={index} progress={progress} tone="ink" />)}
            <motion.div
                data-intro-curtain
                className="absolute inset-0 bg-indigo"
                style={{ clipPath }}
                // The panel itself slides up and out; the shapes leave with it.
                // Kept short so the screen clears well before the hero
                // finishes moving; a slower curtain ate most of the hero's
                // entrance on narrow screens.
            >
                <SystemBackdrop dark variant="welcome" />
                {/* Amber shapes sweep in from opposite corners, then leave
                    with the curtain — the reference site's signature move. */}
                <motion.span
                    className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-pink"
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    // Settled shortly before the peel, so the shapes read as
                    // arriving rather than being yanked away mid-entrance.
                    transition={{ duration: 1.2 / timing.rate, ease: EASE_GLIDE }}
                />
                {flight?.names.map((item, index) => <NameFlight key={index} item={item} index={index} progress={progress} tone="light" />)}
                {/* Name */}
                <div className="relative flex h-full flex-col items-center justify-center px-5 text-center" style={{ visibility: flight ? 'hidden' : undefined }}>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 / timing.rate }} className="font-hand mb-5 text-2xl text-amber">Welcome</motion.span>
                    <motion.span
                        ref={mark}
                        data-intro-mark
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.65 / timing.rate, ease: EASE_GLIDE }}
                        className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-canvas font-display text-4xl font-bold text-canvas sm:h-28 sm:w-28 sm:text-5xl"
                    >
                        {initials}
                    </motion.span>
                    <div data-intro-name className="mt-6 font-display text-[clamp(2rem,5vw,4.5rem)] text-canvas" style={{ fontOpticalSizing: 'none', fontVariationSettings: '"opsz" 80' }}>
                        {profile.nameLines.map((line, index) => (
                            <React.Fragment key={line}>
                                {index > 0 && ' '}
                                <span className="block pb-[0.06em]">
                                    <motion.span
                                        ref={(element) => { starts.current[index] = element; }}
                                        data-intro-name-start={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: (0.12 + index * 0.08) / timing.rate, duration: 0.65 / timing.rate, ease: EASE_GLIDE }}
                                        className="inline-block"
                                    >
                                        {line}
                                    </motion.span>
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 / timing.rate, duration: 0.65 / timing.rate }} className="label mt-4 text-canvas/80">{profile.role}</motion.span>
                </div>
            </motion.div>
            {flight && <MarkFlight item={flight.mark} progress={progress} initials={initials} />}
        </div>
    );
};

export default Preloader;
