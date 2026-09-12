import React, { useEffect, useId, useRef, useState } from 'react';
import { useIntroComplete } from '../hooks/useBooted';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

const DataCore = () => {
    const id = useId();
    const root = useRef(null);
    const host = useRef(null);
    const api = useRef(null);
    const onscreen = useRef(false);
    const introComplete = useIntroComplete();
    const reducedMotion = usePrefersReducedMotion();
    const [status, setStatus] = useState('poster');
    const [expanded, setExpanded] = useState(false);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (!introComplete || reducedMotion) return undefined;
        let cancelled = false;
        let requested = false;
        const fail = () => {
            if (cancelled) return;
            api.current?.destroy();
            api.current = null;
            setStatus('fallback');
        };
        const load = async () => {
            if (requested) return;
            requested = true;
            setStatus('loading');
            try {
                const { createDataCore } = await import('./dataCoreScene');
                if (cancelled) return;
                api.current = createDataCore(host.current, fail);
                api.current.setVisible(onscreen.current);
                setStatus('ready');
            } catch {
                fail();
            }
        };
        const observer = new IntersectionObserver(([entry]) => {
            onscreen.current = entry.isIntersecting;
            api.current?.setVisible(entry.isIntersecting);
            if (entry.isIntersecting) load();
        });
        observer.observe(root.current);
        return () => {
            cancelled = true;
            observer.disconnect();
            api.current?.destroy();
            api.current = null;
        };
    }, [introComplete, reducedMotion]);

    const ready = status === 'ready' && !reducedMotion;
    useEffect(() => { if (ready) api.current?.setExpanded(expanded); }, [expanded, ready]);
    useEffect(() => { if (ready) api.current?.setPaused(paused); }, [paused, ready]);

    return (
        <figure ref={root} data-hero-model data-model-status={reducedMotion ? 'static' : status} className="relative mx-auto w-full max-w-sm rounded-[2rem] border border-indigo/15 bg-canvas/60 p-4 sm:p-5" aria-labelledby={id}>
            <div className="flex h-8 items-start justify-between gap-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-indigo">
                <span>Architecture / 01</span><span>{ready ? 'Interactive 3D' : 'Data core'}</span>
            </div>
            <div className="relative aspect-square" data-model-stage>
                <svg data-model-poster viewBox="0 0 300 330" aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ visibility: ready ? 'hidden' : 'visible' }}>
                    <ellipse cx="150" cy="284" rx="112" ry="24" fill="#332c81" opacity="0.08" />
                    {[{ y: 165, color: '#ffc93c' }, { y: 99, color: '#332c81' }, { y: 33, color: '#ff1e8e' }].map(({ y, color }, i) => (
                        <g key={color} transform={`translate(0 ${y + (expanded ? (1 - i) * 13 : 0)})`}>
                            <path d="M40 42 L150 0 L260 42 L150 85Z" fill={color} stroke="#141225" strokeWidth="1.5" />
                            <path d="M40 42 L150 85 L150 111 L40 68Z" fill={color} stroke="#141225" strokeWidth="1.5" />
                            <path d="M150 85 L260 42 L260 68 L150 111Z" fill={color} stroke="#141225" strokeWidth="1.5" />
                            <path d="M80 42 L150 15 L220 42 L150 69Z" fill="none" stroke="#fff7ec" strokeWidth="2" opacity="0.8" />
                        </g>
                    ))}
                </svg>
                <div ref={host} data-model-canvas className="absolute inset-0" style={{ visibility: ready ? 'visible' : 'hidden' }} />
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[0.6rem] uppercase tracking-wider text-indigo" aria-label="Model layers">
                <span>01 Source</span><span>02 Transform</span><span>03 Serve</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-1.5 text-[0.65rem] font-medium text-indigo">
                <button type="button" data-model-rotate disabled={!ready} onClick={() => api.current?.rotate()} className="min-h-10 rounded-full border border-indigo/25 bg-canvas disabled:opacity-40" aria-label="Rotate model by 45 degrees">Rotate</button>
                <button type="button" data-model-layers aria-pressed={expanded} onClick={() => setExpanded((value) => !value)} className="min-h-10 rounded-full border border-indigo/25 bg-canvas" aria-label={expanded ? 'Assemble data layers' : 'Separate data layers'}>Layers</button>
                <button type="button" data-model-pause disabled={!ready} aria-pressed={paused} onClick={() => setPaused((value) => !value)} className="min-h-10 rounded-full border border-indigo/25 bg-canvas disabled:opacity-40">{paused ? 'Play' : 'Pause'}</button>
                <button type="button" data-model-reset onClick={() => { api.current?.reset(); setExpanded(false); }} className="min-h-10 rounded-full border border-indigo/25 bg-canvas">Reset</button>
            </div>
            <figcaption id={id} className="mt-3 h-14 text-center text-[0.7rem] leading-relaxed text-muted">
                {ready ? 'Drag to rotate. Separate the layers to explore.' : reducedMotion ? 'Static architecture view — motion reduced.' : status === 'fallback' ? 'Static architecture view — 3D unavailable.' : 'Source to serving, one connected system.'}
                <span className="mt-1 block text-[0.6rem]">Illustrative architecture, not live telemetry.</span>
            </figcaption>
        </figure>
    );
};

export default DataCore;
