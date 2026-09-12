import React, { useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MarqueeBand from './components/MarqueeBand';
import Stats from './components/Stats';
import About from './components/About';
import Process from './components/Process';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Credentials from './components/Credentials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import Preloader from './components/Preloader';
import SkipLink from './components/SkipLink';
import ErrorBoundary from './components/ErrorBoundary';
import { registerLenis, scrollToSection } from './utils/smoothScroll';
import { usePrefersReducedMotion } from './hooks/useMediaQuery';
import { getIntroComplete, subscribeBooted } from './utils/bootState';

function App() {
    const reducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (reducedMotion) {
            document.documentElement.style.scrollBehavior = 'auto';
            return undefined;
        }

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            touchMultiplier: 1.6,
        });

        registerLenis(lenis);
        const syncIntro = () => getIntroComplete() ? lenis.start() : lenis.stop();
        syncIntro();
        const unsubscribe = subscribeBooted(syncIntro);

        let frame = requestAnimationFrame(function raf(time) {
            lenis.raf(time);
            frame = requestAnimationFrame(raf);
        });

        return () => {
            cancelAnimationFrame(frame);
            unsubscribe();
            registerLenis(null);
            lenis.destroy();
        };
    }, [reducedMotion]);

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || hash === '#home') return undefined;
        let id;
        try { id = decodeURIComponent(hash.slice(1)); } catch { return undefined; }
        let cancelled = false;
        let jumped = false;
        const cancel = () => { cancelled = true; };
        const jump = () => {
            if (cancelled || jumped || window.location.hash !== hash) return;
            const element = document.getElementById(id);
            if (!element) return;
            jumped = true;
            const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - padding, behavior: 'instant' });
            } else scrollToSection(id, { immediate: true, offset: -padding });
        };
        const timer = window.setTimeout(jump, 1200);
        document.fonts.ready.then(jump);
        for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.addEventListener(event, cancel, { passive: true });
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.removeEventListener(event, cancel);
        };
    }, []);

    // Delegated handler so hash links rendered later (mobile menu, footer) also
    // get smooth scrolling without re-binding listeners.
    useEffect(() => {
        const onClick = (event) => {
            const anchor = event.target.closest?.('a[href^="#"]');
            if (!anchor) return;

            const hash = anchor.getAttribute('href');
            if (!hash || hash === '#' || anchor.dataset.noSmooth) return;
            if (!document.querySelector(hash)) return;

            event.preventDefault();
            scrollToSection(hash);
        };

        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    return (
        <ErrorBoundary>
            <SkipLink />
            {/* Boot state lives in utils/bootState.js rather than here: almost
                every component reads it via useReveal, so it goes through a
                store instead of being threaded down as a prop. */}
            <Preloader />
            <Cursor />

            <div className="min-h-screen overflow-x-clip">
                <Navbar />
                <main id="main">
                    <Hero />
                    <MarqueeBand />
                    <Stats />
                    <About />
                    <Process />
                    <Skills />
                    <Experience />
                    <Projects />
                    <Credentials />
                    <Contact />
                </main>
                <Footer />
            </div>
        </ErrorBoundary>
    );
}

export default App;
