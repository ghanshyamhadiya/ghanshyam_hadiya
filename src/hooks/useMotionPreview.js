import { useSyncExternalStore } from 'react';

const DEFAULT_PRESET = 'curtain';

export const MOTION_PRESETS = [
    { id: 'cinema', label: 'Cinema', description: 'A large heading holds, then settles into the page.' },
    { id: 'lateral', label: 'Lateral', description: 'The heading travels sideways as the content glides into place.' },
    { id: 'curtain', label: 'Curtain', description: 'A single clean sweep reveals the whole title.' },
    { id: 'depth', label: 'Depth', description: 'The heading moves forward from a gently tilted plane.' },
];
const EVENT = 'portfolio-motion-change';
const subscribe = (notify) => {
    window.addEventListener(EVENT, notify);
    window.addEventListener('popstate', notify);
    return () => {
        window.removeEventListener(EVENT, notify);
        window.removeEventListener('popstate', notify);
    };
};
const getPreset = () => {
    const value = new URLSearchParams(window.location.search).get('motion');
    return MOTION_PRESETS.some((preset) => preset.id === value) ? value : DEFAULT_PRESET;
};
const getEnabled = () => new URLSearchParams(window.location.search).get('motion-preview') === '1';
export const useMotionPreset = () => useSyncExternalStore(subscribe, getPreset, () => DEFAULT_PRESET);
export const useMotionPreviewEnabled = () => useSyncExternalStore(subscribe, getEnabled, () => false);
export const setMotionPreset = (preset) => {
    if (!MOTION_PRESETS.some((option) => option.id === preset)) return;
    const url = new URL(window.location.href);
    url.searchParams.set('motion', preset);
    window.history.replaceState(window.history.state, '', url);
    window.dispatchEvent(new Event(EVENT));
};
