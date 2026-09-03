import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profile, site } from '../data';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

const KEY = 'intro-played';

// Boot sequence shown on first load: a counter runs to 100 while a few mono
// status lines print, then panels wipe away to reveal the page.
//
// Deliberate constraints:
//   - session-scoped, so it plays once and never again while the tab lives.
//     A loader you have to sit through on every navigation is a liability.
//   - skipped entirely under prefers-reduced-motion.
//   - dismissible with a click or any key.
//   - scroll is locked only while it is on screen.
const LINES = [
    'establishing connection',
    'loading pipeline manifest',
    'mounting interface',
];

// Guarded because storage is unavailable during server rendering and can throw
// outright in a browser with cookies/storage blocked.
const alreadyPlayed = () => {
    try {
        return window.sessionStorage.getItem(KEY) === '1';
    } catch {
        return false;
    }
};

const Preloader = ({ onDone }) => {
    const reducedMotion = usePrefersReducedMotion();

    // Lazy initialiser so the storage read happens on the client only, once.
    const [skip] = useState(
        () => typeof window === 'undefined' || reducedMotion || alreadyPlayed()
    );

    const [visible, setVisible] = useState(!skip);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (skip) {
            onDone?.();
            return undefined;
        }

        document.body.style.overflow = 'hidden';

        let raf = 0;
        let start = 0;
        const DURATION = 1700;

        const step = (now) => {
            if (!start) start = now;
            const p = Math.min((now - start) / DURATION, 1);
            // easeOutExpo so the number sprints then eases into 100
            const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            setCount(Math.round(eased * 100));
            if (p < 1) raf = requestAnimationFrame(step);
            else window.setTimeout(() => finish(), 260);
        };

        raf = requestAnimationFrame(step);

        function finish() {
            try {
                window.sessionStorage.setItem(KEY, '1');
            } catch {
                /* storage blocked — the intro simply replays next load */
            }
            setVisible(false);
            document.body.style.overflow = '';
            onDone?.();
        }

        const onKey = () => finish();
        const onClick = () => finish();
        window.addEventListener('keydown', onKey);
        window.addEventListener('click', onClick);

        return () => {
            cancelAnimationFrame(raf);
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('click', onClick);
        };
    }, [skip, onDone]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="preloader"
                    className="fixed inset-0 z-[9998] flex flex-col justify-between bg-bg px-5 py-6 sm:px-8"
                    exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.5 } }}
                    role="status"
                    aria-label="Loading"
                >
                    <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />

                    {/* Wipe panels that clear the screen on exit */}
                    {[0, 1, 2, 3].map((i) => (
                        <motion.span
                            key={i}
                            className="absolute top-0 h-full bg-bg"
                            style={{ left: `${i * 25}%`, width: '25.2%' }}
                            initial={{ y: '0%' }}
                            exit={{
                                y: '-100%',
                                transition: {
                                    duration: 0.7,
                                    delay: 0.06 * i,
                                    ease: [0.76, 0, 0.24, 1],
                                },
                            }}
                        />
                    ))}

                    <div className="relative flex items-start justify-between">
                        <span className="label text-accent">{site.shortName}</span>
                        <span className="font-mono text-[0.65rem] tracking-[0.15em] text-subtle">
                            {profile.role}
                        </span>
                    </div>

                    <div className="relative flex items-end justify-between gap-6">
                        <ul className="space-y-1.5">
                            {LINES.map((line, i) => (
                                <motion.li
                                    key={line}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 + i * 0.35, duration: 0.3 }}
                                    className="font-mono text-[0.65rem] tracking-[0.12em] text-subtle"
                                >
                                    <span className="text-accent">›</span> {line}
                                    <span className="ml-1 text-accent">ok</span>
                                </motion.li>
                            ))}
                        </ul>

                        <span className="font-display text-[18vw] leading-[0.8] text-ink sm:text-[12vw]">
                            {String(count).padStart(3, '0')}
                        </span>
                    </div>

                    {/* Progress rule */}
                    <div className="relative mt-6 h-px w-full bg-line">
                        <span
                            className="absolute left-0 top-0 h-px bg-accent transition-none"
                            style={{ width: `${count}%` }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;
