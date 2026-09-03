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
            data-cursor={copied ? 'copied' : 'copy'}
            aria-label={copied ? 'Copied to clipboard' : `${label} ${value}`}
            className={cn(
                'group relative inline-flex items-center gap-2 overflow-hidden border px-5 py-3',
                'font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors duration-300',
                copied
                    ? 'border-accent text-accent'
                    : 'border-line text-muted hover:border-accent/50 hover:text-accent',
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
