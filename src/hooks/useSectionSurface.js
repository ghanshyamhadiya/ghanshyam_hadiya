import { useTransform } from 'framer-motion';
import { useMediaQuery } from './useMediaQuery';
import useGlideProgress from './useGlideProgress';

const useSectionSurface = (ref, enabled = true) => {
    const wide = useMediaQuery('(min-width: 640px)');
    const { progress, reducedMotion } = useGlideProgress(ref, ['start end', 'start 40%']);
    const radius = useTransform(progress, [0, 1], wide ? [144, 56] : [64, 32]);
    return enabled && !reducedMotion
        ? { borderTopLeftRadius: radius, borderTopRightRadius: radius }
        : undefined;
};

export default useSectionSurface;
