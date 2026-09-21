import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WorldContext } from '../hooks/useWorld';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { getIntroComplete } from '../utils/bootState';

const DataCanvas = ({ children }) => {
    const host = useRef(null);
    const world = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    const [status, setStatus] = useState('idle');
    const [paused, setPaused] = useState(false);

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
                const { createWorld } = await import('../three/dataWorld');
                if (cancelled) return;
                api = createWorld(host.current, {
                    onFailure: fail,
                    staticMode: reducedMotion,
                    assembled: getIntroComplete() || reducedMotion,
                });
                if (cancelled) return api?.destroy();
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

    useEffect(() => {
        world.current?.setPaused(paused);
    }, [paused, status]);

    useEffect(() => {
        if (status !== 'ready' || !window.matchMedia('(pointer: fine)').matches) return undefined;
        const onMove = (event) => {
            world.current?.setPointer((event.clientX / window.innerWidth) * 2 - 1);
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        return () => window.removeEventListener('pointermove', onMove);
    }, [status]);

    const registerAnchor = useCallback((id, el) => world.current?.registerAnchor(id, el) ?? (() => {}), []);

    const value = useMemo(() => ({
        status,
        live: status === 'ready' || status === 'static',
        ready: status === 'ready',
        paused,
        setPaused,
        registerAnchor,
        anchorRect: (id) => world.current?.anchorRect(id) ?? null,
        setAssembly: (progress) => world.current?.setAssembly(progress),
        wave: () => {},
        react: () => {},
        setScroll: () => {},
        setVisible: () => {},
    }), [status, paused, registerAnchor]);

    return (
        <WorldContext.Provider value={value}>
            <div
                ref={host}
                data-world-layer
                data-world-status={status}
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-30"
            />
            {children}
        </WorldContext.Provider>
    );
};

export default DataCanvas;
