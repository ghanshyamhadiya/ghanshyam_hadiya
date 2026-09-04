import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profile, site } from '../data';
import { shouldPlayIntro, markIntroPlayed, setBooted } from '../utils/bootState';

// Boot sequence shown on first load: a counter runs to 100 while a few mono
// status lines print, then four panels wipe upward to reveal the page.
//
// Deliberate constraints:
//   - session-scoped, so it plays once and never again while the tab lives.
//     A loader you sit through on every navigation is a liability.
//   - skipped entirely under prefers-reduced-motion.
//   - dismissible with a click or any key.
//   - scroll is locked only while it is on screen.
//
// Timing matters here. setBooted() fires as the wipe STARTS, not when the
// overlay unmounts, so the hero animates while the panels are still travelling
// and the two motions read as one continuous move. Waiting until unmount left a
// visible dead beat, and not gating at all meant the hero finished behind the
// curtain entirely.
const LINES = ['establishing connection', 'loading pipeline manifest', 'mounting interface'];

// Trimmed from 1700ms + a 260ms hold: the old sequence took 3.2s end to end
// before the page appeared, which is far too long to sit through.
const COUNT_DURATION = 1100;

const Preloader = () => {
    const [skip] = useState(() => !shouldPlayIntro());
    const [visible, setVisible] = useState(!skip);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (skip) return undefined;

        document.body.style.overflow = 'hidden';

        let raf = 0;
        let start = 0;
        let finished = false;

        function finish() {
            if (finished) return;
            finished = true;
            markIntroPlayed();
            // Unblock entry animations at the same moment the wipe begins.
            setBooted();
            setVisible(false);
            document.body.style.overflow = '';
        }

        const step = (now) => {
            if (!start) start = now;
            const p = Math.min((now - start) / COUNT_DURATION, 1);
            // easeOutExpo so the number sprints then eases into 100
            const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            setCount(Math.round(eased * 100));
            if (p < 1) raf = requestAnimationFrame(step);
            else finish();
        };

        raf = requestAnimationFrame(step);

        window.addEventListener('keydown', finish);
        window.addEventListener('click', finish);

        return () => {
            cancelAnimationFrame(raf);
            document.body.style.overflow = '';
            window.removeEventListener('keydown', finish);
            window.removeEventListener('click', finish);
        };
    }, [skip]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="preloader"
                    // No background of its own. It previously carried bg-bg,
                    // which sat on top of the wipe panels and hid them
                    // completely — all you saw was the overlay fade out. The
                    // four panels are the cover now.
                    className="pointer-events-none fixed inset-0 z-[9998] flex flex-col justify-between px-5 py-6 sm:px-8"
                    role="status"
                    aria-label="Loading"
                >
                    {/* Wipe panels: they cover the screen, then travel up.
                        Each carries a copper line on its trailing edge —
                        without it the wipe is invisible, because the panels are
                        the same colour as the page behind them. The four lines
                        sweeping up at staggered offsets are what actually reads
                        as a curtain lifting. */}
                    {[0, 1, 2, 3].map((i) => (
                        <motion.span
                            key={i}
                            className="absolute top-0 h-full border-b border-accent/70 bg-bg"
                            style={{ left: `${i * 25}%`, width: '25.4%' }}
                            initial={{ y: '0%' }}
                            exit={{
                                y: '-101%',
                                transition: {
                                    // Kept short on purpose. The panels travel
                                    // upward, so the upper half of the page —
                                    // where the headline sits — is uncovered
                                    // late; a slow wipe ate most of the hero's
                                    // motion before it could be seen.
                                    duration: 0.55,
                                    delay: 0.04 * i,
                                    ease: [0.76, 0, 0.24, 1],
                                },
                            }}
                        />
                    ))}

                    <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />

                    {/* Content sits above the panels and clears quickly so it
                        never lingers over the revealed page. */}
                    <motion.div
                        className="relative flex h-full flex-col justify-between"
                        exit={{ opacity: 0, transition: { duration: 0.22 } }}
                    >
                        <div className="flex items-start justify-between">
                            <span className="label text-accent">{site.shortName}</span>
                            <span className="font-mono text-[0.65rem] tracking-[0.15em] text-subtle">
                                {profile.role}
                            </span>
                        </div>

                        <div className="flex items-end justify-between gap-6">
                            <ul className="space-y-1.5">
                                {LINES.map((line, i) => (
                                    <motion.li
                                        key={line}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.15 + i * 0.24, duration: 0.25 }}
                                        className="font-mono text-[0.62rem] tracking-[0.12em] text-subtle sm:text-[0.65rem]"
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

                        <div className="relative mt-5 h-px w-full shrink-0 bg-line">
                            <span
                                className="absolute left-0 top-0 h-px bg-accent"
                                style={{ width: `${count}%` }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;
