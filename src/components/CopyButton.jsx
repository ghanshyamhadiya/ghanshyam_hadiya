import React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../utils/cn';
import useCopyToClipboard from '../hooks/useCopyToClipboard';

const CopyButton = ({ value, label = 'Copy', className, invert = false }) => {
    const { copied, copy } = useCopyToClipboard();

    return (
        <button
            type="button"
            onClick={() => copy(value)}
            data-cursor={copied ? 'copied' : 'copy'}
            aria-label={copied ? 'Copied to clipboard' : `${label} ${value}`}
            className={cn(
                'inline-flex items-center gap-2 rounded-md border px-4 py-2',
                'font-display text-[0.8rem] font-semibold transition-colors duration-300',
                invert
                    ? 'border-canvas/40 text-canvas hover:bg-canvas hover:text-indigo'
                    : 'border-ink text-ink hover:bg-ink hover:text-canvas',
                copied && (invert ? 'border-amber text-amber' : 'border-pink-deep text-pink-deep'),
                className
            )}
        >
            {copied ? (
                <Check size={14} aria-hidden="true" />
            ) : (
                <Copy size={14} aria-hidden="true" />
            )}
            {/* aria-live so the confirmation is announced, not just shown. */}
            <span aria-live="polite">{copied ? 'Copied' : label}</span>
        </button>
    );
};

export default CopyButton;
