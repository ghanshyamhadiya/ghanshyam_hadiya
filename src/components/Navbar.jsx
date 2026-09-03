import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Download, ArrowUpRight } from 'lucide-react';
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
                className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-accent"
            />

            <motion.header
                initial={{ y: -120 }}
                animate={{ y: hidden && !isOpen ? -140 : 0 }}
                transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                className={cn(
                    'fixed left-0 right-0 top-0 z-50 border-b transition-colors duration-500',
                    scrolled
                        ? 'border-line bg-bg/85 backdrop-blur-xl'
                        : 'border-transparent bg-transparent'
                )}
            >
                <div
                    className={cn(
                        'mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 transition-[height] duration-400 sm:px-8',
                        scrolled ? 'h-14' : 'h-20'
                    )}
                >
                    {/* Wordmark */}
                    <a
                        href="#home"
                        onClick={go('home')}
                        data-cursor="home"
                        className="group flex items-baseline gap-2"
                    >
                        <span className="font-display text-base leading-none text-ink sm:text-lg">
                            {site.shortName}
                        </span>
                        <span
                            className="h-1.5 w-1.5 bg-accent transition-transform duration-300 group-hover:rotate-45"
                            aria-hidden="true"
                        />
                    </a>

                    {/* Inline nav — hairline separated, no container */}
                    <nav aria-label="Main" className="hidden items-center lg:flex">
                        {navLinks.map((link, index) => {
                            const isActive = active === link.id;
                            return (
                                <a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={go(link.id)}
                                    aria-current={isActive ? 'true' : undefined}
                                    className={cn(
                                        'group relative px-3.5 py-2 font-mono text-[0.66rem] uppercase tracking-[0.12em] transition-colors duration-300',
                                        isActive ? 'text-accent' : 'text-subtle hover:text-ink'
                                    )}
                                >
                                    <span className="mr-1.5 text-[0.55rem] text-subtle/60 tabular-nums">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    {link.title}

                                    {/* Underline that wipes in on hover */}
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-0 left-3.5 right-3.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                                    />

                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-active"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 34,
                                            }}
                                            className="absolute bottom-0 left-3.5 right-3.5 h-px bg-accent"
                                        />
                                    )}
                                </a>
                            );
                        })}
                    </nav>

                    {/* CV */}
                    <div className="hidden lg:block">
                        <Magnetic>
                            <a
                                href={profile.resume.href}
                                download
                                data-cursor="download cv"
                                className="group relative inline-flex items-center gap-2 overflow-hidden border border-accent px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-accent transition-colors duration-300 hover:text-bg"
                            >
                                <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
                                <Download size={13} aria-hidden="true" className="relative" />
                                <span className="relative">CV</span>
                            </a>
                        </Magnetic>
                    </div>

                    {/* Mobile toggle — two rules that form an X */}
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                        className="relative z-[70] flex h-10 w-10 flex-col items-center justify-center gap-[5px] border border-line transition-colors duration-300 hover:border-accent/50 lg:hidden"
                    >
                        <motion.span
                            animate={isOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                            className="block h-px w-4 bg-ink"
                        />
                        <motion.span
                            animate={isOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                            className="block h-px w-4 bg-ink"
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
                        initial={{ clipPath: 'inset(0 0 100% 0)' }}
                        animate={{ clipPath: 'inset(0 0 0% 0)' }}
                        exit={{ clipPath: 'inset(0 0 100% 0)' }}
                        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                        className="fixed inset-0 z-[65] bg-bg lg:hidden"
                    >
                        <div className="grid-bg pointer-events-none absolute inset-0" />

                        <nav className="relative flex h-full w-full flex-col justify-center px-6 pb-16 pt-24 sm:px-10">
                            {navLinks.map((link, index) => (
                                <motion.a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={go(link.id)}
                                    initial={{ y: 26, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        delay: 0.22 + index * 0.05,
                                        duration: 0.5,
                                        ease: EASE_OUT_EXPO,
                                    }}
                                    className={cn(
                                        'group flex items-baseline gap-4 border-b border-line py-3.5 transition-colors duration-300',
                                        active === link.id ? 'text-accent' : 'text-muted'
                                    )}
                                >
                                    <span className="font-mono text-[0.58rem] tracking-[0.18em] text-subtle">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="font-display text-3xl leading-none transition-transform duration-300 group-hover:translate-x-2 sm:text-4xl">
                                        {link.title}
                                    </span>
                                </motion.a>
                            ))}

                            <motion.div
                                initial={{ y: 18, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.52, duration: 0.5, ease: EASE_OUT_EXPO }}
                                className="mt-9 flex flex-col gap-2"
                            >
                                <a
                                    href={profile.resume.href}
                                    download
                                    className="inline-flex items-center justify-center gap-2.5 bg-accent px-6 py-3.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-bg"
                                >
                                    <Download size={14} aria-hidden="true" />
                                    {profile.resume.label}
                                </a>
                                <a
                                    href={`mailto:${profile.email}`}
                                    className="inline-flex items-center justify-center gap-2 border border-line-strong px-6 py-3.5 font-mono text-[0.66rem] tracking-[0.06em] text-muted"
                                >
                                    {profile.email}
                                    <ArrowUpRight size={13} aria-hidden="true" />
                                </a>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
