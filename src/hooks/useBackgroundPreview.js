import { useSyncExternalStore } from 'react';

const DEFAULT_BACKGROUND = 'paper';

export const BACKGROUND_PRESETS = [
    { id: 'ambient', label: 'Ambient', description: 'Soft sage light and a fine paper grain, moving gently with scroll.' },
    { id: 'contours', label: 'Contours', description: 'Oversized fine-line curves frame the headings, leaving the copy clear.' },
    { id: 'paper', label: 'Paper', description: 'Alternating warm-white and pale-sage sheets with gently shifting edges.' },
];
const EVENT = 'portfolio-background-change';
const subscribe = (notify) => {
    window.addEventListener(EVENT, notify);
    window.addEventListener('popstate', notify);
    return () => {
        window.removeEventListener(EVENT, notify);
        window.removeEventListener('popstate', notify);
    };
};
const getEnabled = () => new URLSearchParams(window.location.search).get('background-preview') === '1';
const valid = (value) => value === 'plain' || BACKGROUND_PRESETS.some((option) => option.id === value);
const getPreset = () => {
    const value = new URLSearchParams(window.location.search).get('background');
    return valid(value) ? value : DEFAULT_BACKGROUND;
};
export const useBackgroundPreset = () => useSyncExternalStore(subscribe, getPreset, () => DEFAULT_BACKGROUND);
export const useBackgroundPreviewEnabled = () => useSyncExternalStore(subscribe, getEnabled, () => false);
export const setBackgroundPreset = (preset) => {
    if (!valid(preset)) return;
    const url = new URL(window.location.href);
    url.searchParams.set('background', preset);
    window.history.replaceState(window.history.state, '', url);
    window.dispatchEvent(new Event(EVENT));
};
