import { useCallback, useEffect, useRef, useState } from 'react';

// Copies text and reports a transient `copied` flag for UI feedback.
// Falls back to a hidden textarea + execCommand where the async Clipboard API
// is unavailable (older Safari, or any non-secure origin).
export function useCopyToClipboard({ resetAfter = 2000 } = {}) {
    const [copied, setCopied] = useState(false);
    const timer = useRef(null);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const copy = useCallback(
        async (text) => {
            if (!text) return false;

            let ok = false;
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                    ok = true;
                } else {
                    const area = document.createElement('textarea');
                    area.value = text;
                    area.setAttribute('readonly', '');
                    area.style.position = 'fixed';
                    area.style.opacity = '0';
                    document.body.appendChild(area);
                    area.select();
                    ok = document.execCommand('copy');
                    document.body.removeChild(area);
                }
            } catch {
                ok = false;
            }

            if (ok) {
                setCopied(true);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => setCopied(false), resetAfter);
            }

            return ok;
        },
        [resetAfter]
    );

    return { copied, copy };
}

export default useCopyToClipboard;
