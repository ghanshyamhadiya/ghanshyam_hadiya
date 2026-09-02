import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import Magnetic from './Magnetic';
import { cn } from '../utils/cn';
import { EASE_OUT_EXPO } from '../utils/motion';
import { scrollToSection } from '../utils/smoothScroll';
import { navLinks, profile } from '../data';
import useActiveSection from '../hooks/useActiveSection';
import useScrollInfo from '../hooks/useScrollInfo';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { scrolled, hidden } = useScrollInfo();
    const sectionIds = useMemo(() => navLinks.map((link) => link.id), []);
    const active = useActiveSection(sectionIds);

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
        setIsOpen(false);
        // Let the overlay finish closing before scrolling.
        window.setTimeout(() => scrollToSection(id), isOpen ? 320 : 0);
    };

    return (
        <>
            <motion.div
                style={{ scaleX: progress }}
                className="fixed top-0 left-0 right-0 h-[2px] origin-left bg-white/70 z-[60] pointer-events-none"
            />

            <motion.header
                initial={{ y: -120, opacity: 0 }}
                animate={{ y: hidden && !isOpen ? -140 : 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none"
            >
                <div
                    className={cn(
                        'mx-auto flex items-center justify-between gap-4 max-w-7xl pointer-events-auto',
                        'transition-[padding] duration-500 ease-out',
                        scrolled ? 'pt-3' : 'pt-5 sm:pt-7'
                    )}
                >
                    {/* Logo island */}
                    <a
                        href="#home"
                        onClick={go('home')}
                        className={cn(
                            'group relative flex items-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl',
                            'shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out',
                            'hover:border-white/25 hover:bg-white/[0.12]',
                            scrolled ? 'px-4 py-2.5' : 'px-5 py-3'
                        )}
                    >
                        <span className="text-base sm:text-lg font-black uppercase tracking-tighter text-white">
                            {profile.name}
                        </span>
                        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.7)]" />
                    </a>

                    {/* Desktop pill */}
                    <nav
                        className={cn(
                            'hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl',
                            'shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out',
                            'absolute left-1/2 -translate-x-1/2',
                            scrolled ? 'p-1 top-3' : 'p-1.5 top-5 lg:top-7'
                        )}
                    >
                        {navLinks.map((link) => {
                            const isActive = active === link.id;
                            return (
                                <a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={go(link.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        'relative rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-300',
                                        isActive ? 'text-black' : 'text-white/60 hover:text-white'
                                    )}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-active-pill"
                                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                            className="absolute inset-0 rounded-full bg-white"
                                        />
                                    )}
                                    <span className="relative z-10">{link.title}</span>
                                </a>
                            );
                        })}
                    </nav>

                    {/* CTA island */}
                    <div className="hidden md:block">
                        <Magnetic>
                            <a
                                href={profile.cta.href}
                                onClick={go(profile.cta.href.replace('#', ''))}
                                className={cn(
                                    'group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white text-black',
                                    'text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300',
                                    'hover:bg-transparent hover:text-white hover:border-white/40',
                                    scrolled ? 'px-5 py-2.5' : 'px-6 py-3'
                                )}
                            >
                                {profile.cta.label}
                                <ArrowUpRight
                                    size={16}
                                    className="transition-transform duration-300 group-hover:rotate-45"
                                />
                            </a>
                        </Magnetic>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isOpen}
                        className="md:hidden relative z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.16] active:scale-95"
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
                                    <X size={20} />
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="open"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu size={20} />
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.header>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[65] md:hidden bg-[#050505]/80 backdrop-blur-2xl"
                    >
                        <motion.nav
                            initial={{ clipPath: 'circle(0% at calc(100% - 3rem) 3rem)' }}
                            animate={{ clipPath: 'circle(150% at calc(100% - 3rem) 3rem)' }}
                            exit={{ clipPath: 'circle(0% at calc(100% - 3rem) 3rem)' }}
                            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                            className="flex h-full w-full flex-col justify-center gap-1 px-8 pb-16 pt-24"
                        >
                            {navLinks.map((link, index) => (
                                <motion.a
                                    key={link.id}
                                    href={`#${link.id}`}
                                    onClick={go(link.id)}
                                    initial={{ y: 40, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        delay: 0.18 + index * 0.06,
                                        duration: 0.6,
                                        ease: EASE_OUT_EXPO,
                                    }}
                                    className={cn(
                                        'group flex items-baseline gap-4 border-b border-white/10 py-4 transition-colors duration-300',
                                        active === link.id ? 'text-white' : 'text-white/50'
                                    )}
                                >
                                    <span className="text-[0.65rem] font-bold tracking-[0.3em] text-white/30">
                                        0{index + 1}
                                    </span>
                                    <span className="text-4xl sm:text-5xl font-black uppercase tracking-tighter transition-transform duration-300 group-hover:translate-x-2">
                                        {link.title}
                                    </span>
                                </motion.a>
                            ))}

                            <motion.a
                                href={`mailto:${profile.email}`}
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.55, duration: 0.6, ease: EASE_OUT_EXPO }}
                                className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-black"
                            >
                                {profile.email}
                                <ArrowUpRight size={16} />
                            </motion.a>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
