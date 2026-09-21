import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Download, ArrowUpRight, X } from 'lucide-react';
import Button from './Button';
import { cn } from '../utils/cn';
import { EASE_OUT_EXPO } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import { navLinks, profile, site } from '../data';
import useActiveSection from '../hooks/useActiveSection';
import useScrollInfo from '../hooks/useScrollInfo';
import useFocusTrap from '../hooks/useFocusTrap';
import useBooted, { useIntroComplete } from '../hooks/useBooted';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { scrolled, hidden } = useScrollInfo();
    const sectionIds = useMemo(() => navLinks.map((link) => link.id), []);
    const active = useActiveSection(sectionIds);

    // Holds the slide-in until the curtain lifts, so it isn't spent off-screen.
    const booted = useBooted();
    const introComplete = useIntroComplete();

    const dialogRef = useRef(null);
    useFocusTrap(dialogRef, isOpen);

    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const onKeyDown = (event) => event.key === 'Escape' && setIsOpen(false);
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const go = (id) => (event) => {
        event.preventDefault();
        const wasOpen = isOpen;
        setIsOpen(false);
        window.setTimeout(() => scrollToSection(id), wasOpen ? 320 : 0);
    };

    return (
        <>
            <motion.div
                style={{ scaleX: progress }}
                className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left bg-pink-deep"
            />

            <motion.header
                initial={false}
                animate={{ y: introComplete && hidden && !isOpen ? -140 : 0, opacity: booted ? 1 : 0 }}
                transition={{ duration: 0.55, ease: EASE_OUT_EXPO, opacity: { duration: introComplete ? 0 : 0.55 } }}
                inert={!introComplete}
                className="pointer-events-none fixed left-0 right-0 top-0 z-50 px-5 pt-0 sm:px-8 sm:pt-0"
            >
                <div
                    className={cn(
                        'pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4',
                        'border-b border-line py-4 transition-colors duration-300',
                        scrolled ? 'bg-canvas/95 backdrop-blur-lg' : 'bg-canvas'
                    )}
                >
                    {/* Wordmark */}
                    <a
                        href="#home"
                        onClick={go('home')}
                        data-cursor="home"
                        className="group flex items-center gap-2 pl-2"
                    >
                        <span data-nav-mark style={{ opacity: introComplete ? 1 : 0 }} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-[0.7rem] font-bold text-canvas transition-colors duration-300 group-hover:bg-pink group-hover:text-ink">
                            GH
                        </span>
                        <span className="font-display text-base font-bold sm:text-lg">
                            {site.shortName}
                        </span>
                    </a>

                    {/* Pill nav */}
                    <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
                        {navLinks.map((link) => {
                            const isActive = active === link.id;
                            return (
                                <a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={go(link.id)}
                                    aria-current={isActive ? 'true' : undefined}
                                    className={cn(
                                        'relative rounded-full px-3.5 py-2 font-display text-[0.85rem] font-semibold transition-colors duration-300',
                                        isActive ? 'text-ink' : 'text-muted hover:text-ink'
                                    )}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-active"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 34,
                                            }}
                                            className="absolute inset-x-3 bottom-1 h-px bg-ink"
                                        />
                                    )}
                                    <span className="relative">{link.title}</span>
                                </a>
                            );
                        })}
                    </nav>

                    <div className="hidden lg:block">
                        <Button
                            as="a"
                            href={profile.resume.href}
                            download
                            variant="outline"
                            size="sm"
                            data-cursor="download cv"
                            icon={<Download size={13} />}
                        >
                            CV
                        </Button>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                        className="relative z-[70] flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full bg-ink lg:hidden"
                    >
                        <motion.span
                            animate={isOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                            className="block h-0.5 w-4 rounded-full bg-canvas"
                        />
                        <motion.span
                            animate={isOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                            className="block h-0.5 w-4 rounded-full bg-canvas"
                        />
                    </button>
                </div>
            </motion.header>

            {/* Mobile overlay — a real modal dialog: labelled, focus-trapped,
                Escape-closable, and it restores focus to the toggle on close. */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="mobile-menu"
                        id="mobile-menu"
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Site navigation"
                        tabIndex={-1}
                        initial={{ clipPath: 'circle(0% at calc(100% - 3rem) 3rem)' }}
                        animate={{ clipPath: 'circle(150% at calc(100% - 3rem) 3rem)' }}
                        exit={{ clipPath: 'circle(0% at calc(100% - 3rem) 3rem)' }}
                        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                        className="fixed inset-0 z-[65] bg-canvas lg:hidden"
                    >
                        <button
                            type="button"
                            aria-label="Close menu"
                            onClick={() => setIsOpen(false)}
                            className="absolute right-5 top-4 z-10 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-line bg-canvas px-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas sm:right-8"
                        >
                            <span>Close</span>
                            <X size={18} aria-hidden="true" />
                        </button>
                        <nav className="flex h-full w-full flex-col justify-center px-6 pb-16 pt-24 sm:px-10">
                            {navLinks.map((link, index) => (
                                <motion.a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={go(link.id)}
                                    initial={{ y: 24, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        delay: 0.2 + index * 0.05,
                                        duration: 0.5,
                                        ease: EASE_OUT_EXPO,
                                    }}
                                    className={cn(
                                        'group flex items-baseline gap-4 border-b border-ink/15 py-3.5 transition-colors duration-300',
                                        active === link.id ? 'text-pink-deep' : 'text-ink'
                                    )}
                                >
                                    <span className="font-mono text-[0.6rem] tracking-[0.16em] text-ink/50">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="font-display text-3xl transition-transform duration-300 group-hover:translate-x-2 sm:text-4xl">
                                        {link.title}
                                    </span>
                                </motion.a>
                            ))}

                            <motion.div
                                initial={{ y: 18, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.55, duration: 0.5, ease: EASE_OUT_EXPO }}
                                className="mt-9 flex flex-col gap-2.5"
                            >
                                <Button as="a" href={profile.resume.href} download variant="ink" size="lg">
                                    <Download size={16} aria-hidden="true" />
                                    {profile.resume.label}
                                </Button>
                                <Button
                                    as="a"
                                    href={`mailto:${profile.email}`}
                                    variant="outline"
                                    size="lg"
                                    icon={<ArrowUpRight size={15} />}
                                >
                                    {profile.email}
                                </Button>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
