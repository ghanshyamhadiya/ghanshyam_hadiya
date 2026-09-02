import { useEffect, useState } from 'react';

// Reports how far the page is scrolled and which way the user is moving.
// The floating navbar uses this to shrink on scroll and hide when scrolling down.
export function useScrollInfo({ threshold = 40, hideAfter = 260 } = {}) {
    const [state, setState] = useState({ scrolled: false, hidden: false, y: 0 });

    useEffect(() => {
        let lastY = window.scrollY;
        let ticking = false;

        const update = () => {
            const y = window.scrollY;
            const delta = y - lastY;

            setState((prev) => {
                const scrolled = y > threshold;
                let hidden = prev.hidden;

                if (Math.abs(delta) > 6) hidden = delta > 0 && y > hideAfter;
                if (y <= threshold) hidden = false;

                if (prev.scrolled === scrolled && prev.hidden === hidden) return prev;
                return { scrolled, hidden, y };
            });

            lastY = y;
            ticking = false;
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold, hideAfter]);

    return state;
}

export default useScrollInfo;
