import React from 'react';

// Visually hidden until focused. Lets keyboard users jump past the navbar
// straight to the content.
const SkipLink = () => (
    <a
        href="#main"
        className="skip-link rounded-full bg-ink px-4 py-2 font-display text-sm font-semibold text-canvas"
    >
        Skip to content
    </a>
);

export default SkipLink;
