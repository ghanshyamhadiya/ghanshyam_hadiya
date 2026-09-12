import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import useGlideProgress from '../../hooks/useGlideProgress';
import { cn } from '../../utils/cn';

// Scroll phase runs +0.5 (entering) to -0.5 (leaving). The group both lifts
// and tilts, so the pose is built in one place and reused by the scroll
// listener and the first paint.
const pose = (geometry, value) => {
    const phase = 0.5 - Math.max(0, Math.min(1, value));
    return {
        offset: String(geometry.centre + phase * geometry.travel),
        transform: `translate(0 ${phase * geometry.lift}) rotate(${phase * geometry.tilt} ${geometry.width / 2} ${geometry.height / 2})`,
    };
};

const ArcHeading = ({ id, text, className }) => {
    const ref = useRef(null);
    const textRef = useRef(null);
    const pathRefs = useRef([]);
    const groupRef = useRef(null);
    const curveId = useId();
    const { progress: scrollYProgress, reducedMotion } = useGlideProgress(ref);
    const [geometry, setGeometry] = useState(null);
    const enhanced = Boolean(geometry) && !reducedMotion;
    const split = String(text).indexOf(',') + 1;
    const mobileLines = split ? [text.slice(0, split), text.slice(split).trim()] : [text];

    useMotionValueEvent(scrollYProgress, 'change', (value) => {
        if (enhanced) {
            const { offset, transform } = pose(geometry, value);
            pathRefs.current.forEach((path) => path?.setAttribute('startOffset', offset));
            groupRef.current?.setAttribute('transform', transform);
        }
    });

    useEffect(() => {
        if (reducedMotion || !document.fonts || !window.ResizeObserver) return undefined;
        let cancelled = false;
        let observer;
        const measure = () => {
            if (cancelled || !textRef.current || !ref.current) return;
            const { width, height } = ref.current.getBoundingClientRect();
            const split = String(text).indexOf(',') + 1;
            const lines = width < 640 && split ? [text.slice(0, split), text.slice(split).trim()] : [text];
            let size = lines.length > 1 ? Math.min(44, width * 0.135) : Math.min(96, width * 0.088);
            size = Math.max(30, size);
            const travel = Math.min(44, width * 0.075);
            const measureLine = (line) => {
                textRef.current.textContent = line;
                textRef.current.setAttribute('font-size', String(size));
                return textRef.current.getComputedTextLength();
            };
            const widest = Math.max(...lines.map(measureLine));
            if (!Number.isFinite(widest) || widest <= 0) return;
            const available = width - travel - size * 1.2 - 16;
            size = Math.max(30, size * Math.min(1, available / widest));
            const radius = Math.max(800, width * 2.5);
            const baseline = lines.length > 1 ? height / 2 - size * 0.5 : height * 0.55 + size * 0.15;
            setGeometry({
                width,
                height,
                size,
                centre: Math.PI * radius / 2,
                travel,
                lift: Math.min(84, height * 0.3),
                tilt: 6,
                lines: lines.map((line, index) => ({
                    text: line,
                    path: `M ${width / 2 - radius} ${baseline + index * size * 1.5 + radius} A ${radius} ${radius} 0 0 1 ${width / 2 + radius} ${baseline + index * size * 1.5 + radius}`,
                })),
            });
        };
        const prepare = async () => {
            try {
                const family = getComputedStyle(ref.current).fontFamily.split(',')[0];
                const faces = await document.fonts.load(`800 96px ${family}`, text);
                if (cancelled || !faces.length) return;
                observer = new ResizeObserver(measure);
                observer.observe(ref.current);
            } catch {
                return;
            }
        };
        prepare();
        return () => {
            cancelled = true;
            observer?.disconnect();
        };
    }, [text, reducedMotion]);

    useLayoutEffect(() => {
        if (enhanced) {
            const { offset, transform } = pose(geometry, scrollYProgress.get());
            pathRefs.current.forEach((path) => path?.setAttribute('startOffset', offset));
            groupRef.current?.setAttribute('transform', transform);
        }
    }, [enhanced, geometry, scrollYProgress]);

    return (
        <h2
            ref={ref}
            id={id}
            data-heading-motion="arc"
            data-arc-mode="contained"
            data-arc-ready={enhanced ? 'true' : 'false'}
            className={cn('relative isolate flex h-[clamp(208px,24vw,360px)] items-center justify-center', className)}
            style={{ fontSize: 'clamp(1.875rem, 7vw, 5.25rem)', fontWeight: 800, fontVariationSettings: '"opsz" 80, "wght" 800', letterSpacing: '-0.035em', lineHeight: 1.2 }}
        >
            <span className="sr-only">{text}</span>
            <span aria-hidden="true" className={cn('max-w-full px-3 text-center', enhanced && 'invisible')}>
                {mobileLines.map((line, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && ' '}
                        <span className="block sm:inline">{line}</span>
                    </React.Fragment>
                ))}
            </span>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ visibility: enhanced ? 'visible' : 'hidden' }}
            >
                <svg
                    data-arc-svg
                    aria-hidden="true"
                    focusable="false"
                    viewBox={`0 0 ${geometry?.width ?? 1000} ${geometry?.height ?? 240}`}
                    className="h-full w-full overflow-visible"
                >
                    <defs>
                        <text ref={textRef} visibility="hidden" aria-hidden="true" fontSize={96}>{text}</text>
                        {geometry?.lines.map((line, index) => (
                            <path key={index} id={`${curveId}-${index}`} d={line.path} fill="none" />
                        ))}
                    </defs>
                    <g ref={groupRef} data-arc-motion>
                        {geometry?.lines.map((line, index) => (
                            <text key={index} data-arc-text fill="currentColor" fontSize={geometry.size}>
                                <textPath ref={(path) => { pathRefs.current[index] = path; }} href={`#${curveId}-${index}`} startOffset={geometry.centre} textAnchor="middle">
                                    {line.text}
                                </textPath>
                            </text>
                        ))}
                    </g>
                </svg>
            </span>
        </h2>
    );
};

export default ArcHeading;
