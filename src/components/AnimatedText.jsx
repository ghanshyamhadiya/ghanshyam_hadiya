import React from 'react';
import Reveal from './Reveal';
import { stagger } from '../utils/motion';

// Reveals a paragraph as one block.
//
// This previously animated word by word, giving every word its own
// IntersectionObserver — roughly 200 on this page. Under fast scrolling a large
// share of them never fired, leaving individual words permanently invisible
// mid-sentence (29 of them, measured at 390px). Per-word motion is not worth a
// paragraph with holes in it, and the block reveal reads calmer anyway.
const AnimatedText = ({ text, className, delay = 0, index = 0, as = 'p' }) => (
    <Reveal as={as} delay={delay || stagger(index)} className={className}>
        {text}
    </Reveal>
);

export default AnimatedText;
