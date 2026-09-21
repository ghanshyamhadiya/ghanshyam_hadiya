import React from 'react';
import Station from './Station';
import { useWorld } from '../hooks/useWorld';

const DataScene = ({ id, className = '' }) => {
    const world = useWorld();
    return <div className={`data-scene ${className}`} data-scene={id} aria-hidden="true">
        <Station id={id} className="absolute inset-0" />
        {!world.live && <svg data-scene-fallback viewBox="0 0 400 320" className="absolute inset-0 h-full w-full" fill="none">
            <ellipse cx="200" cy="160" rx="157" ry="75" stroke="#ffc93c" strokeWidth="2" transform="rotate(-25 200 160)" />
            {[0, 1, 2].map((i) => <g key={i} transform={`translate(0 ${i * 46 - 46})`}>
                <path d="M110 145 200 100 290 145 200 190Z" fill={['#ff1e8e', '#7669de', '#ffc93c'][i]} stroke="#fff7ec" strokeWidth="2" />
                <path d="M110 145v18l90 45 90-45v-18l-90 45Z" fill={['#b81567', '#51439d', '#d79720'][i]} />
            </g>)}
            <circle cx="338" cy="111" r="9" fill="#ff1e8e" />
        </svg>}
    </div>;
};

export default DataScene;
