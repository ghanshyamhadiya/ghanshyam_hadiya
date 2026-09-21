import React, { useState } from 'react';
import { X, ChevronUp, RotateCcw } from 'lucide-react';
import { MOTION_PRESETS, setMotionPreset, useMotionPreset, useMotionPreviewEnabled } from '../hooks/useMotionPreview';
import { BACKGROUND_PRESETS, setBackgroundPreset, useBackgroundPreset, useBackgroundPreviewEnabled } from '../hooks/useBackgroundPreview';
import { useIntroComplete } from '../hooks/useBooted';
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { scrollToSection } from '../utils/smoothScroll';
import { cn } from '../utils/cn';

const MotionLab = () => {
    const motionEnabled = useMotionPreviewEnabled();
    const backgroundEnabled = useBackgroundPreviewEnabled();
    const introComplete = useIntroComplete();
    const motionPreset = useMotionPreset();
    const background = useBackgroundPreset();
    const reducedMotion = usePrefersReducedMotion();
    const shortViewport = useMediaQuery('(max-height: 600px)');
    const [expanded, setExpanded] = useState(true);
    const still = reducedMotion || shortViewport;

    const backgroundMode = !motionEnabled;
    const options = backgroundMode ? BACKGROUND_PRESETS : MOTION_PRESETS;
    const preset = backgroundMode ? background : motionPreset;
    const selectPreset = backgroundMode ? setBackgroundPreset : setMotionPreset;
    const selected = options.find((option) => option.id === preset) ?? { label: 'Original', description: 'The original plain background, for comparison.' };
    const panelId = backgroundMode ? 'background-lab-panel' : 'motion-lab-panel';

    if ((!motionEnabled && !backgroundEnabled) || !introComplete) return null;

    const replay = () => {
        const sections = [...document.querySelectorAll('[data-cinematic-section]')];
        let section = sections[0];
        for (const candidate of sections) {
            if (candidate.getBoundingClientRect().top <= window.innerHeight * .45) section = candidate;
        }
        if (!section) return;
        const track = section.querySelector('[data-scene-track]');
        const pinTop = parseFloat(getComputedStyle(section).getPropertyValue('--scene-pin-top')) || 0;
        const offset = track.getBoundingClientRect().top - section.getBoundingClientRect().top - pinTop - 32;
        if (reducedMotion) {
            window.scrollTo({ top: track.getBoundingClientRect().top + window.scrollY - pinTop - 32, behavior: 'instant' });
        } else scrollToSection(section.id, { offset, duration: .65, immediate: shortViewport });
    };

    return (
        <aside
            data-motion-lab={backgroundMode ? undefined : ''}
            data-background-lab={backgroundMode ? '' : undefined}
            aria-label={backgroundMode ? 'Background preview' : 'Motion preview'}
            className={cn('motion-lab', !expanded && 'motion-lab--collapsed')}
        >
            <div className="motion-lab-header">
                <span className="font-mono text-[10px] uppercase tracking-[.12em]">{backgroundMode ? 'Background lab' : 'Motion lab'} <span className="text-subtle">/ {String(options.findIndex((option) => option.id === preset) + 1).padStart(2, '0')} {selected.label}</span></span>
                <button
                    type="button"
                    data-motion-lab-toggle={backgroundMode ? undefined : ''}
                    data-background-lab-toggle={backgroundMode ? '' : undefined}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    aria-label={expanded ? (backgroundMode ? 'Hide background controls' : 'Hide motion controls') : (backgroundMode ? 'Show background controls' : 'Show motion controls')}
                    onClick={() => setExpanded((value) => !value)}
                    className="motion-lab-toggle"
                >{expanded ? <X size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}</button>
            </div>
            <div
                id={panelId}
                data-motion-lab-panel={backgroundMode ? undefined : ''}
                data-background-lab-panel={backgroundMode ? '' : undefined}
                hidden={!expanded}
            >
                <div role="group" aria-label={backgroundMode ? 'Background direction' : 'Animation direction'} className={cn('motion-lab-options', backgroundMode && 'background-lab-options')}>
                    {options.map((option, index) => <button key={option.id} type="button" data-motion-option={backgroundMode ? undefined : option.id} data-background-option={backgroundMode ? option.id : undefined} aria-pressed={preset === option.id} onClick={() => selectPreset(option.id)}><span className="font-mono text-[10px] opacity-60">0{index + 1}</span><span>{option.label}</span></button>)}
                </div>
                <p aria-live="polite" className="motion-lab-description">{still ? 'Motion is static for reduced motion or short screens.' : selected.description}</p>
                <div className="motion-lab-footer">
                    {backgroundMode
                        ? <button type="button" data-background-original aria-pressed={preset === 'plain'} onClick={() => setBackgroundPreset('plain')}>Compare original</button>
                        : <span>All 7 sections · scroll to compare</span>}
                    <button type="button" data-motion-replay={backgroundMode ? undefined : ''} data-background-replay={backgroundMode ? '' : undefined} onClick={replay}><RotateCcw size={13} aria-hidden="true" /> Replay section</button>
                </div>
            </div>
        </aside>
    );
};

export default MotionLab;
