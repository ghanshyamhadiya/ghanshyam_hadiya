import React from 'react';
import { motion, useTransform } from 'framer-motion';

const BackgroundArt = ({ preset, progress, still, inverted = false, alternate = false }) => {
    const drift = useTransform(progress, [0, 1], [-24, 24]);
    const sway = useTransform(progress, [0, 1], [-12, 12]);
    const rotation = useTransform(progress, [0, 1], [-3, 3]);
    const curve = useTransform(progress, (value) => `${48 - 10 * value}% ${18 + 10 * value}%`);
    if (preset === 'plain') return null;
    return (
        <div aria-hidden="true" data-background-art={preset} data-background-mode={still ? 'static' : 'scroll'} data-background-inverted={inverted ? 'true' : 'false'} data-background-alternate={alternate ? 'true' : 'false'} className="section-backdrop">
            {preset === 'ambient' && <>
                <motion.div data-background-moving className="backdrop-ambient" style={still ? undefined : { y: drift, x: sway }} />
                <div className="backdrop-grain" />
            </>}
            {preset === 'contours' && <motion.svg data-background-moving className="backdrop-contours" viewBox="0 0 1200 700" preserveAspectRatio="xMaxYMin slice" focusable="false" style={still ? undefined : { y: drift, rotate: rotation }}>
                {Array.from({ length: 7 }, (_, index) => <path key={index} d="M 430 -90 C 1130 -140 530 330 1110 390 S 1120 820 1520 840" transform={`translate(${-index * 42} ${index * 20})`} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
            </motion.svg>}
            {preset === 'paper' && <>
                <div className="backdrop-paper-wash" />
                <motion.div data-background-moving className="backdrop-paper-sheet" style={still ? undefined : { y: drift, borderBottomLeftRadius: curve, borderBottomRightRadius: curve }} />
            </>}
        </div>
    );
};

export default BackgroundArt;
