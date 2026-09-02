import React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../utils/cn';
import useCopyToClipboard from '../hooks/useCopyToClipboard';

const CopyButton = ({ value, label = 'Copy', className }) => {
    const { copied, copy } = useCopyToClipboard();

    return (
        <button
            type="button"
            onClick={() => copy(value)}
            aria-label={copied ? 'Copied to clipboard' : `${label} ${value}`}
            className={cn(
                'group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2',
                'font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted',
                'transition-colors duration-300 hover:border-accent/50 hover:text-accent',
                className
            )}
        >
            {copied ? (
                <Check size={13} className="text-accent" aria-hidden="true" />
            ) : (
                <Copy size={13} aria-hidden="true" />
            )}
            {/* aria-live so the confirmation is announced, not just shown. */}
            <span aria-live="polite">{copied ? 'Copied' : label}</span>
        </button>
    );
};

export default CopyButton;
