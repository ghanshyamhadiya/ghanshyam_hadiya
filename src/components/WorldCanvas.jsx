import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WorldContext } from '../hooks/useWorld';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { getIntroComplete } from '../utils/bootState';

// Mounts the single WebGL layer for the whole page.
//
// The canvas is fixed over the viewport with pointer-events: none. That is
// deliberate: opaque geometry then occludes real DOM text, which is how the
// figure stands in front of the hero <h1> while the name stays a genuine
// heading for crawlers and screen readers. Clicks and text selection pass
// straight through to the document underneath.
//
// z-index sits above the intro curtain so the figure can assemble while the
// curtain is still peeling away.

const WorldCanvas = ({ children }) => {
    const host = useRef(null);
    const world = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        let cancelled = false;
        let api = null;
        const fail = () => {
            if (cancelled) return;
            api?.destroy();
            api = null;
            world.current = null;
            setStatus('fallback');
        };
        (async () => {
            setStatus('loading');
            try {
                const { createWorld } = await import('../three/world');
                if (cancelled) return;
                api = createWorld(host.current, {
                    onFailure: fail,
                    staticMode: reducedMotion,
                    // Only start scattered when an intro is actually going to
                    // play it in. A deep link or a repeat visit that skips the
                    // curtain must find the figure already standing.
                    assembled: reducedMotion || getIntroComplete(),
                });
                if (!api) return fail();
                world.current = api;
                setStatus(reducedMotion ? 'static' : 'ready');
            } catch {
                fail();
            }
        })();
        return () => {
            cancelled = true;
            api?.destroy();
            world.current = null;
        };
    }, [reducedMotion]);

    // Pointer parallax and the drag-to-spin gesture both live here rather than
    // on the canvas: under pointer-events: none the canvas never receives
    // events, so the window is the only listener that works.
    useEffect(() => {
        if (status !== 'ready') return undefined;
        let dragging = null;
        const onMove = (event) => {
            world.current?.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
            if (dragging) {
                world.current?.spinBy((event.clientX - dragging.x) * 0.006);
                dragging.x = event.clientX;
            }
        };
        const onDown = (event) => {
            if (!event.target.closest?.('[data-figure-grab]')) return;
            dragging = { x: event.clientX };
        };
        const onUp = () => { dragging = null; };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerdown', onDown);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [status]);

    const value = useMemo(() => ({
        status,
        // A world exists and should be told where things are, even when it is
        // the static reduced-motion one.
        live: status === 'ready' || status === 'static',
        // Only the animated world runs a loop worth driving per frame.
        ready: status === 'ready',
        setAnchor: (rect) => world.current?.setAnchor(rect),
        setScroll: (progress) => world.current?.setScroll(progress),
        setAssembly: (progress) => world.current?.setAssembly(progress),
        wave: () => world.current?.wave(),
        react: () => world.current?.react(),
    }), [status]);

    return (
        <WorldContext.Provider value={value}>
            <div
                ref={host}
                data-world-layer
                data-world-status={status}
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-[9999]"
            />
            {children}
        </WorldContext.Provider>
    );
};

export default WorldCanvas;
