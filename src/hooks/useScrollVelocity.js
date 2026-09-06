import { useMotionValue, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { usePrefersReducedMotion } from './useMediaQuery';

// Maps scroll speed onto a blur amount and a slight skew, for the motion-blur
// effect the reference site uses on fast-moving text.
//
// `filter` forces a repaint, so this deliberately snaps back to exactly 0 at
// rest rather than hovering at a fraction of a pixel — a permanently blurred
// layer would cost paint on every frame for no visible benefit.
export function useScrollVelocity({ maxBlur = 3, maxSkew = 2.5, cap = 2500 } = {}) {
    const reducedMotion = usePrefersReducedMotion();

    const { scrollY } = useScroll();
    const raw = useVelocity(scrollY);
    const smooth = useSpring(raw, { stiffness: 260, damping: 42, mass: 0.4 });

    // Every hook runs unconditionally; the reduced-motion choice happens on the
    // returned values, not by skipping a hook.
    const still = useMotionValue(0);

    const liveBlur = useTransform(smooth, (v) => {
        const amount = Math.min(Math.abs(v) / cap, 1) * maxBlur;
        return amount < 0.15 ? 'blur(0px)' : `blur(${amount.toFixed(2)}px)`;
    });

    const liveSkew = useTransform(smooth, (v) => {
        const amount = Math.max(-1, Math.min(1, v / cap)) * maxSkew;
        return Math.abs(amount) < 0.1 ? 0 : amount;
    });

    const noBlur = useTransform(still, () => 'blur(0px)');

    return reducedMotion ? { blur: noBlur, skew: still } : { blur: liveBlur, skew: liveSkew };
}

export default useScrollVelocity;
