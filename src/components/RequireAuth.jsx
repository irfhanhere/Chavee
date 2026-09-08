import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from './Spinner.jsx';
import { useAuthContext } from '../context/AuthContext.jsx';

/**
 * Route guard — the single place the app decides "send this person to /login".
 *
 *   loading / unknown  -> spinner. NEVER redirect: 'unknown' means we
 *                         couldn't read the session (network / lock race),
 *                         not that the user is signed out.
 *   unauthenticated     -> <Navigate to="/login">, EXCEPT when `allowPreview`
 *                         is set and sessionStorage.previewMode === 'true'
 *                         (logged-out "preview the app" mode — AppShell
 *                         renders a restricted UI instead).
 *   authenticated       -> render children.
 */
export default function RequireAuth({ children, allowPreview = false }) {
    const { status } = useAuthContext();
    const location = useLocation();

    if (status === 'loading' || status === 'unknown') {
        return <PageLoader message="Loading Chavee... 🔒" />;
    }

    if (status === 'unauthenticated') {
        if (allowPreview) {
            let preview = false;
            try {
                preview = sessionStorage.getItem('previewMode') === 'true';
            } catch {
                /* sessionStorage blocked — treat as no preview */
            }
            if (preview) return children;
        }
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname + location.search }}
            />
        );
    }

    return children;
}
