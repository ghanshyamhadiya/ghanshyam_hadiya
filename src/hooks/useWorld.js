import { createContext, useContext } from 'react';

// Kept out of WorldCanvas.jsx so that file only exports a component, which is
// what react-refresh needs to hot-reload it.
//
// Defaults are no-ops rather than null: every consumer calls these during
// layout effects, and a world that failed to start, or a reduced-motion visit
// that never starts one, must not force a null check at every call site.
export const WorldContext = createContext({
    status: 'idle',
    live: false,
    ready: false,
    registerAnchor: () => () => {},
    anchorRect: () => null,
    paused: false,
    setPaused: () => {},
    setScroll: () => {},
    setVisible: () => {},
    setAssembly: () => {},
    wave: () => {},
    react: () => {},
});

export const useWorld = () => useContext(WorldContext);
