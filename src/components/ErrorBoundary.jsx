import React from 'react';

// Stops a single render error from blanking the whole page. Class component
// because componentDidCatch has no hook equivalent.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('Portfolio render error:', error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
                <p className="label text-accent">Something broke</p>
                <h1 className="font-display text-4xl text-ink">This section failed to load.</h1>
                <p className="max-w-md text-muted">
                    Try reloading the page. If it keeps happening, the details are in the browser
                    console.
                </p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-2 border border-accent bg-accent px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] text-bg transition-colors hover:bg-transparent hover:text-accent"
                >
                    Reload
                </button>
            </div>
        );
    }
}

export default ErrorBoundary;
