import { useEffect, useState } from 'react';

// Tracks which section id is currently closest to the middle of the viewport.
// Used by the floating navbar to move its active pill indicator.
export function useActiveSection(ids, { offset = 0.35 } = {}) {
    const [active, setActive] = useState(ids[0]);

    useEffect(() => {
        if (!ids.length) return undefined;

        const resolve = () => {
            const line = window.innerHeight * offset;
            let current = ids[0];

            for (const id of ids) {
                const element = document.getElementById(id);
                if (!element) continue;
                if (element.getBoundingClientRect().top <= line) current = id;
            }

            // Snap to the last section once the page is scrolled to the bottom,
            // otherwise short trailing sections can never become active.
            const atBottom =
                window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
            if (atBottom) current = ids[ids.length - 1];

            setActive((prev) => (prev === current ? prev : current));
        };

        resolve();
        window.addEventListener('scroll', resolve, { passive: true });
        window.addEventListener('resize', resolve);
        return () => {
            window.removeEventListener('scroll', resolve);
            window.removeEventListener('resize', resolve);
        };
    }, [ids, offset]);

    return active;
}

export default useActiveSection;
