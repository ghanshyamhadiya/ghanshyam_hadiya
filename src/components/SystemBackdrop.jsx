import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { cn } from '../utils/cn';

const paths = [
    'M 0 60 H 52 V 240 H 104 V 450 H 36 V 760 H 0',
    'M 1440 170 H 1388 V 350 H 1336 V 560 H 1404 V 940 H 1440',
];

const SystemBackdrop = ({ dark = false, variant = 'network', className }) => {
    const ref = useRef(null);
    const reduced = usePrefersReducedMotion();
    const [visible, setVisible] = useState(false);
    const [foreground, setForeground] = useState(true);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        observer.observe(ref.current);
        const visibility = () => setForeground(!document.hidden);
        document.addEventListener('visibilitychange', visibility);
        return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
    }, []);
    const animate = visible && foreground && !reduced;

    return (
        <div ref={ref} aria-hidden="true" data-system-background={variant} className={cn('pointer-events-none absolute inset-0 overflow-hidden [--system-gutter:20px] xl:[--system-gutter:160px]', className)} style={{ maskImage: 'linear-gradient(to right, black, transparent var(--system-gutter), transparent calc(100% - var(--system-gutter)), black)' }}>
            <svg viewBox="0 0 1440 1000" preserveAspectRatio="none" className="h-full w-full" fill="none" stroke={dark ? '#ffc93c' : '#332c81'} strokeWidth="1.5">
                <g opacity={dark ? 0.18 : 0.13}>
                    {paths.map((path) => <path key={path} d={path} />)}
                    {[120, 420, 720].map((y, i) => (
                        <g key={y} transform={`translate(${i % 2 ? 1390 : 24} ${y})`}>
                            <path d="M0 -22 L34 -4 L0 15 L-34 -4Z M-34 -4 V20 L0 39 L34 20 V-4 M0 15 V39" />
                            <circle r="50" strokeDasharray={variant === 'work' ? '3 12' : '2 8'} />
                        </g>
                    ))}
                    <path d="M0 900 H100 M20 880 V920 M40 880 V920 M60 880 V920 M80 880 V920 M1340 80 H1440 M1360 60 V100 M1380 60 V100 M1400 60 V100 M1420 60 V100" />
                </g>
                {paths.map((path, i) => (
                    <circle key={path} r="4" fill={dark ? '#ffc93c' : '#ff1e8e'} stroke="none" opacity="0.65">
                        {animate ? <animateMotion path={path} dur={`${16 + i * 5}s`} repeatCount="indefinite" /> : null}
                    </circle>
                ))}
            </svg>
        </div>
    );
};

export const SystemEmblem = ({ dark = false, className }) => (
    <svg aria-hidden="true" viewBox="0 0 180 128" className={cn('h-20 w-28 shrink-0', className)} fill="none" stroke={dark ? '#fff7ec' : '#332c81'} strokeWidth="1.5">
        {[{ y: 56, color: '#ffc93c' }, { y: 32, color: '#332c81' }, { y: 8, color: '#ff1e8e' }].map(({ y, color }) => (
            <g key={color} transform={`translate(90 ${y})`}>
                <path d="M0 0 L55 24 L0 48 L-55 24Z M-55 24 V36 L0 60 L55 36 V24 M0 48 V60" fill={color} fillOpacity="0.22" />
            </g>
        ))}
        <path d="M12 20 H35 M24 8 V32 M145 105 H168 M156 93 V117" />
    </svg>
);

export default SystemBackdrop;
