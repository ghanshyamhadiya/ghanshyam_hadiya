import React from 'react';

// Visually hidden until focused. Lets keyboard users jump past the floating
// navbar straight to the content.
const SkipLink = () => (
    <a
        href="#main"
        className="skip-link rounded-full border border-accent/50 bg-bg px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-accent"
    >
        Skip to content
    </a>
);

export default SkipLink;
