import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
import { scrollToSection } from '../../utils/smoothScroll';
import useActiveSection from '../../hooks/useActiveSection';

// Jump nav for the run. A reviewer skimming should be able to reach a specific
// project without scrolling the whole pipeline, and should always know which
// one they are looking at.
//
// Scrolls horizontally on narrow screens rather than wrapping, so it stays one
// predictable row.
const StageIndex = ({ projects }) => {
    const ids = useMemo(() => projects.map((p) => `work-${p.slug}`), [projects]);
    const active = useActiveSection(ids, { offset: 0.45 });

    return (
        // Sticky, so a reviewer can jump between projects from anywhere in the
        // run rather than having to scroll back to the top to find the index.
        // The backdrop keeps stage content legible as it passes underneath.
        <nav
            aria-label="Projects"
            className="no-scrollbar sticky top-16 z-30 -mx-5 mb-10 flex gap-2 overflow-x-auto bg-indigo/90 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:mb-12 sm:top-20 sm:px-8"
        >
            {projects.map((project, index) => {
                const id = `work-${project.slug}`;
                const isActive = active === id;

                return (
                    <button
                        key={project.slug}
                        type="button"
                        onClick={() => scrollToSection(id)}
                        aria-current={isActive ? 'true' : undefined}
                        data-cursor="jump"
                        className={cn(
                            'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 font-display text-[0.8rem] font-semibold transition-colors duration-300',
                            isActive
                                ? 'bg-amber text-ink'
                                : 'bg-canvas/10 text-canvas/70 hover:bg-canvas/20 hover:text-canvas'
                        )}
                    >
                        <span className="font-mono text-[0.62rem] opacity-60">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        {project.title}
                    </button>
                );
            })}
        </nav>
    );
};

export default StageIndex;
