import React, { useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Credentials from './components/Credentials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import AnimatedNoise from './components/AnimatedNoise';
import SkipLink from './components/SkipLink';
import ErrorBoundary from './components/ErrorBoundary';
import { registerLenis, scrollToSection } from './utils/smoothScroll';
import { usePrefersReducedMotion } from './hooks/useMediaQuery';

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

        let frame = requestAnimationFrame(function raf(time) {
            lenis.raf(time);
            frame = requestAnimationFrame(raf);
        });

        return () => {
            cancelAnimationFrame(frame);
            registerLenis(null);
            lenis.destroy();
        };
    }, [reducedMotion]);

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
            <AnimatedNoise />
            <Cursor />
            <div className="min-h-screen overflow-x-clip">
                <Navbar />
                <main id="main">
                    <Hero />
                    <Stats />
                    <About />
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
