import React from 'react';

// Real, cross-browser error text a failed dynamic import() throws when a
// route's chunk 404s — e.g. a tab left open across a deploy, where the
// old build's hashed chunk filenames no longer exist on the server.
// Chrome: "Failed to fetch dynamically imported module: ..."
// Firefox: "error loading dynamically imported module: ..."
// Safari:  "Importing a module script failed"
const CHUNK_LOAD_ERROR_PATTERN = /dynamically imported module|importing a module script failed/i;

function isChunkLoadError(error) {
    return !!error && CHUNK_LOAD_ERROR_PATTERN.test(error.message || '');
}

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, isChunkError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, isChunkError: isChunkLoadError(error) };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.state.isChunkError) {
                return (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] h-full bg-gray-50 p-6 text-center text-gray-900 font-sans">
                        <div className="text-[3rem] mb-4">🚀</div>
                        <h2 className="text-2xl font-bold mb-2">A new version of Chavee is available</h2>
                        <p className="text-gray-600 mb-6 max-w-md">This tab has been open a while and is running an older build. Reload to get the latest version.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-full font-bold transition-all shadow-sm active:scale-95 text-sm"
                        >
                            Reload
                        </button>
                    </div>
                );
            }
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] h-full bg-gray-50 p-6 text-center text-gray-900 font-sans">
                    <div className="text-[3rem] mb-4">🌿</div>
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6 max-w-md">We encountered an unexpected error while loading this page. Please refresh to try again.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-full font-bold transition-all shadow-sm active:scale-95 text-sm"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
