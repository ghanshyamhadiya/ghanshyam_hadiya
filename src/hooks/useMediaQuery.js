import { useCallback, useSyncExternalStore } from 'react';

// Returns true while the given media query matches.
// useSyncExternalStore keeps this tear-free and avoids a setState-in-effect pass.
export function useMediaQuery(query) {
    const subscribe = useCallback(
        (onChange) => {
            const mql = window.matchMedia(query);
            mql.addEventListener('change', onChange);
            return () => mql.removeEventListener('change', onChange);
        },
        [query]
    );

    const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
    const getServerSnapshot = () => false;

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');
// The pinned work carousel needs real width to stay readable, so it starts at
// lg rather than md; below that the cards become a native swipe strip.
export const useIsLarge = () => useMediaQuery('(min-width: 1024px)');
export const useIsTouch = () => useMediaQuery('(hover: none), (pointer: coarse)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

export default useMediaQuery;
