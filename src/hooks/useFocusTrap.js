import { useEffect } from 'react';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

// Keeps Tab focus inside `ref` while `active`, moves focus in on open and
// restores it to whatever was focused before on close. Required for the mobile
// menu to behave as a real modal dialog rather than a visual overlay that
// keyboard users can tab straight out of.
export function useFocusTrap(ref, active) {
    useEffect(() => {
        if (!active || !ref.current) return undefined;

        const container = ref.current;
        const previouslyFocused = document.activeElement;

        const nodes = () => Array.from(container.querySelectorAll(FOCUSABLE));

        // Move focus into the dialog on the next frame, once it has rendered.
        const raf = requestAnimationFrame(() => {
            const [first] = nodes();
            (first ?? container).focus?.();
        });

        const onKeyDown = (event) => {
            if (event.key !== 'Tab') return;

            const items = nodes();
            if (!items.length) return;

            const first = items[0];
            const last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        container.addEventListener('keydown', onKeyDown);

        return () => {
            cancelAnimationFrame(raf);
            container.removeEventListener('keydown', onKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [ref, active]);
}

export default useFocusTrap;
