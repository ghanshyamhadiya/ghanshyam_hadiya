import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Blob from './Blob';
import { profile } from '../data';
import {
    shouldPlayIntro,
    introDuration,
    markIntroPlayed,
    setBooted,
} from '../utils/bootState';
import { EASE_OUT_EXPO } from '../utils/motion';

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
//   - the whole sequence finishes under 2.6s.
//
// Session-scoped, dismissible by click or key, skipped under reduced motion.

// Two lengths. The first load of a session plays in full so the name has time
// to land; every refresh after that plays a compressed version, because an
// intro you sit through on every reload stops being an introduction and starts
// being a toll gate.
const TIMING = {
    full: { peelAt: 1400, greeting: 0.1, name: 0.2, nameStep: 0.12, role: 0.75, blob: 0.55 },
    short: { peelAt: 780, greeting: 0.02, name: 0.06, nameStep: 0.07, role: 0.34, blob: 0.24 },
};

const EASE_CURTAIN = [0.76, 0, 0.24, 1];

const Preloader = () => {
    const [skip] = useState(() => !shouldPlayIntro());
    const [mode] = useState(() => introDuration());
    const t = TIMING[mode] ?? TIMING.full;
    const [visible, setVisible] = useState(!skip);

    useEffect(() => {
        if (skip) return undefined;

        document.body.style.overflow = 'hidden';
        let finished = false;

        function finish() {
            if (finished) return;
            finished = true;
            markIntroPlayed();
            // Unblock the hero at the same moment the curtain begins to leave.
            setBooted();
            setVisible(false);
            document.body.style.overflow = '';
        }

        const timer = window.setTimeout(finish, t.peelAt);
        window.addEventListener('keydown', finish);
        window.addEventListener('click', finish);

        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = '';
            window.removeEventListener('keydown', finish);
            window.removeEventListener('click', finish);
        };
    }, [skip, t.peelAt]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="intro"
                    data-intro-curtain
                    role="status"
                    aria-label="Loading"
                    className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden bg-indigo"
                    // The panel itself slides up and out; the shapes leave with it.
                    // Kept short so the screen clears well before the hero
                    // finishes moving; a slower curtain ate most of the hero's
                    // entrance on narrow screens.
                    exit={{
                        y: '-100%',
                        transition: { duration: 0.58, ease: EASE_CURTAIN },
                    }}
                >
                    {/* Amber shapes sweep in from opposite corners, then leave
                        with the curtain — the reference site's signature move. */}
                    <motion.div
                        className="absolute -right-[18%] -top-[22%] h-[62vh] w-[62vh]"
                        initial={{ scale: 0, rotate: -40 }}
                        animate={{ scale: 1, rotate: 0 }}
                        // Settled shortly before the peel, so the shapes read as
                        // arriving rather than being yanked away mid-entrance.
                        transition={{ duration: t.blob + 0.1, delay: t.blob, ease: EASE_OUT_EXPO }}
                    >
                        <Blob variant={0} color="#FFC93C" className="inset-0 h-full w-full" drift={false} />
                    </motion.div>

                    <motion.div
                        className="absolute -bottom-[24%] -left-[16%] h-[54vh] w-[54vh]"
                        initial={{ scale: 0, rotate: 30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            duration: t.blob + 0.1,
                            delay: t.blob + 0.11,
                            ease: EASE_OUT_EXPO,
                        }}
                    >
                        <Blob variant={3} color="#FF1E8E" className="inset-0 h-full w-full" drift={false} />
                    </motion.div>

                    {/* Name */}
                    <div className="relative flex h-full w-full flex-col items-center justify-center px-5 text-center">
                        <motion.span
                            initial={{ opacity: 0, y: 12, rotate: -8 }}
                            animate={{ opacity: 1, y: 0, rotate: -8 }}
                            transition={{ duration: 0.4, delay: t.greeting, ease: EASE_OUT_EXPO }}
                            className="font-hand mb-1 text-2xl text-amber sm:text-3xl"
                        >
                            {profile.greeting}
                        </motion.span>

                        <h1 className="font-display text-display text-canvas">
                            {profile.nameLines.map((line, i) => (
                                <span key={line} className="block overflow-hidden pb-[0.06em]">
                                    <motion.span
                                        initial={{ y: '108%' }}
                                        animate={{ y: 0 }}
                                        transition={{
                                            duration: mode === 'short' ? 0.5 : 0.75,
                                            delay: t.name + i * t.nameStep,
                                            ease: EASE_OUT_EXPO,
                                        }}
                                        className="block"
                                    >
                                        {line}
                                    </motion.span>
                                </span>
                            ))}
                        </h1>

                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35, delay: t.role }}
                            className="label mt-5 text-canvas/70"
                        >
                            {profile.role}
                        </motion.span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;
