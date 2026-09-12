import React, { Fragment } from 'react';

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
const wordStyle = { display: 'inline-block', maxWidth: '100%', verticalAlign: 'baseline' };

const SplitText = ({ text, renderGlyph, renderWord, markGlyphs = true }) => {
    const tokens = String(text).split(/(\s+)/u);
    const words = tokens.filter((token) => token && !/^\s+$/u.test(token));
    const characters = words.map((word) => segmenter
        ? Array.from(segmenter.segment(word), ({ segment }) => segment)
        : Array.from(word));
    const count = characters.reduce((total, word) => total + word.length, 0);
    let index = 0;
    let wordIndex = 0;

    return tokens.map((token, tokenIndex) => {
        if (!token || /^\s+$/u.test(token)) return <Fragment key={tokenIndex}>{token}</Fragment>;
        const currentWord = wordIndex++;
        const glyphs = characters[currentWord].map((character, characterIndex) => {
            const currentIndex = index++;
            const props = {
                'data-heading-glyph': markGlyphs ? '' : undefined,
                style: { display: 'inline-block' },
                children: character,
            };
            return (
                <Fragment key={characterIndex}>
                    {renderGlyph
                        ? renderGlyph({ character, index: currentIndex, count, wordIndex: currentWord, props })
                        : <span {...props} />}
                </Fragment>
            );
        });
        const props = { style: wordStyle, children: glyphs };
        return (
            <Fragment key={tokenIndex}>
                {renderWord
                    ? renderWord({ word: token, index: currentWord, count: words.length, props })
                    : <span {...props} />}
            </Fragment>
        );
    });
};

export default SplitText;
