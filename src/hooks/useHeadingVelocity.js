import { useEffect, useMemo } from 'react';

let users = 0;
let sample = { y: 0, time: 0, speed: 0 };

const onScroll = () => {
    const time = performance.now();
    const elapsed = time - sample.time;
    if (elapsed < 8) return;
    sample = {
        y: window.scrollY,
        time,
        speed: elapsed > 200 ? 0 : (Math.abs(window.scrollY - sample.y) * 1000) / elapsed,
    };
};

const useHeadingVelocity = (visible, delay = 0) => {
    useEffect(() => {
        if (users++ === 0) {
            sample = { y: window.scrollY, time: performance.now(), speed: 0 };
            window.addEventListener('scroll', onScroll, { passive: true });
        }
        return () => {
            if (--users === 0) window.removeEventListener('scroll', onScroll);
        };
    }, []);

    return useMemo(() => {
        if (!visible || typeof window === 'undefined') return Math.min(delay, 0.24);
        const speed = performance.now() - sample.time < 160 ? sample.speed : 0;
        const multiplier = 1 - Math.max(0, Math.min(1, (speed - 800) / 1200));
        return Math.min(delay, 0.24) * multiplier;
    }, [visible, delay]);
};

export default useHeadingVelocity;
