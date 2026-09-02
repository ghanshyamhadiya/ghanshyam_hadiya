import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Menu, X, Download, ArrowUpRight } from 'lucide-react';
import Magnetic from './Magnetic';
import { cn } from '../utils/cn';
import { EASE_OUT_EXPO } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import { navLinks, profile, site } from '../data';
import useActiveSection from '../hooks/useActiveSection';
import useScrollInfo from '../hooks/useScrollInfo';
import useFocusTrap from '../hooks/useFocusTrap';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { scrolled, hidden } = useScrollInfo();
    const sectionIds = useMemo(() => navLinks.map((link) => link.id), []);
    const active = useActiveSection(sectionIds);

    const dialogRef = useRef(null);
    useFocusTrap(dialogRef, isOpen);

    // Thin progress bar pinned to the very top of the viewport.
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

    // Lock body scroll while the mobile overlay is open.
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
        // Let the overlay finish closing before scrolling.
        window.setTimeout(() => scrollToSection(id), wasOpen ? 320 : 0);
    };

    return (
        <>
            <motion.div
                style={{ scaleX: progress }}
                className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-accent/70"
            />

            <motion.header
                initial={{ y: -120, opacity: 0 }}
                animate={{ y: hidden && !isOpen ? -140 : 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                className="pointer-events-none fixed left-0 right-0 top-0 z-50 px-4 sm:px-6"
            >
                <div
                    className={cn(
                        'pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4',
                        'transition-[padding] duration-500 ease-out',
                        scrolled ? 'pt-3' : 'pt-5 sm:pt-6'
                    )}
                >
                    {/* Wordmark island */}
                    <a
                        href="#home"
                        onClick={go('home')}
                        className={cn(
                            'group flex items-center gap-2.5 rounded-full border border-line bg-surface/70 backdrop-blur-xl',
                            'shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out',
                            'hover:border-accent/30',
                            scrolled ? 'px-4 py-2.5' : 'px-5 py-3'
                        )}
                    >
                        <span className="font-display text-base leading-none text-ink sm:text-lg">
                            {site.shortName}
                        </span>
                        <span
                            className="h-1.5 w-1.5 rounded-full bg-accent"
                            aria-hidden="true"
                        />
                    </a>

                    {/* Centre pill — six mono labels need the lg breakpoint to
                        sit comfortably; below that the overlay takes over. */}
                    <nav
                        aria-label="Main"
                        className={cn(
                            'absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full',
                            'border border-line bg-surface/70 backdrop-blur-xl lg:flex',
                            'shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out',
                            scrolled ? 'top-3 p-1' : 'top-5 p-1.5 lg:top-6'
                        )}
                    >
                        {navLinks.map((link) => {
                            const isActive = active === link.id;
                            return (
                                <a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={go(link.id)}
                                    aria-current={isActive ? 'true' : undefined}
                                    className={cn(
                                        'relative rounded-full px-3.5 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] transition-colors duration-300',
                                        isActive ? 'text-accent' : 'text-subtle hover:text-ink'
                                    )}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-active-pill"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 380,
                                                damping: 32,
                                            }}
                                            className="absolute inset-0 rounded-full border border-accent/40 bg-accent-soft"
                                        />
                                    )}
                                    <span className="relative z-10">{link.title}</span>
                                </a>
                            );
                        })}
                    </nav>

                    {/* CV island */}
                    <div className="hidden lg:block">
                        <Magnetic>
                            <a
                                href={profile.resume.href}
                                download
                                className={cn(
                                    'group inline-flex items-center gap-2 rounded-full bg-accent text-bg',
                                    'font-mono text-[0.68rem] uppercase tracking-[0.12em] transition-all duration-300',
                                    'hover:bg-accent-hi',
                                    scrolled ? 'px-5 py-2.5' : 'px-5 py-3'
                                )}
                            >
                                <Download size={13} aria-hidden="true" />
                                CV
                            </a>
                        </Magnetic>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                        className="relative z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/70 text-ink backdrop-blur-xl transition-colors duration-300 hover:border-accent/30 active:scale-95 lg:hidden"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {isOpen ? (
                                <motion.span
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X size={19} />
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="open"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu size={19} />
                                </motion.span>
                            )}
                        </AnimatePresence>
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[65] bg-bg/90 backdrop-blur-2xl lg:hidden"
                    >
                        <motion.nav
                            initial={{ clipPath: 'circle(0% at calc(100% - 3rem) 3rem)' }}
                            animate={{ clipPath: 'circle(150% at calc(100% - 3rem) 3rem)' }}
                            exit={{ clipPath: 'circle(0% at calc(100% - 3rem) 3rem)' }}
                            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                            className="flex h-full w-full flex-col justify-center gap-1 px-7 pb-16 pt-24 sm:px-10"
                        >
                            {navLinks.map((link, index) => (
                                <motion.a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={go(link.id)}
                                    initial={{ y: 24, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        delay: 0.14 + index * 0.05,
                                        duration: 0.5,
                                        ease: EASE_OUT_EXPO,
                                    }}
                                    className={cn(
                                        'group flex items-baseline gap-4 border-b border-line py-3.5 transition-colors duration-300',
                                        active === link.id ? 'text-accent' : 'text-muted'
                                    )}
                                >
                                    <span className="font-mono text-[0.6rem] tracking-[0.2em] text-subtle">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="font-display text-3xl leading-none transition-transform duration-300 group-hover:translate-x-1.5 sm:text-4xl">
                                        {link.title}
                                    </span>
                                </motion.a>
                            ))}

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.48, duration: 0.5, ease: EASE_OUT_EXPO }}
                                className="mt-9 flex flex-col gap-3"
                            >
                                <a
                                    href={profile.resume.href}
                                    download
                                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-bg"
                                >
                                    <Download size={14} aria-hidden="true" />
                                    {profile.resume.label}
                                </a>
                                <a
                                    href={`mailto:${profile.email}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-line-strong px-6 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted"
                                >
                                    {profile.email}
                                    <ArrowUpRight size={13} aria-hidden="true" />
                                </a>
                            </motion.div>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
