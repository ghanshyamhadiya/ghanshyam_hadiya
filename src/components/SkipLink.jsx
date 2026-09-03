import React from 'react';

// Visually hidden until focused. Lets keyboard users jump past the navbar
// straight to the content.
const SkipLink = () => (
    <a
        href="#main"
        className="skip-link border border-accent bg-bg px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-accent"
    >
        Skip to content
    </a>
);

export default SkipLink;
