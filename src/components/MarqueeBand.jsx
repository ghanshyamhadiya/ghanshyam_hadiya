import React from 'react';
import Marquee from './Marquee';
import { marqueeItems } from '../data';

// Full-bleed ticker between the hero and the evidence sections. Indigo so it
// acts as a hard rule separating the identity zone above from the work below.
const MarqueeBand = () => (
    <div className="border-y-2 border-ink bg-indigo py-4 text-canvas sm:py-5">
        <Marquee items={marqueeItems} speed={42} separator="✦" />
    </div>
);

export default MarqueeBand;
