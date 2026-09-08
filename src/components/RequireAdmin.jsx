import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { PageLoader } from './Spinner.jsx';
import RequireAuth from './RequireAuth.jsx';
import { useAuthContext } from '../context/AuthContext.jsx';

/**
 * <RequireAuth> + an is_admin() RPC check. A signed-in non-admin is sent
 * to /dashboard (authenticated, just not authorised) — not to /login.
 */
function AdminGate({ children }) {
    const { user, status } = useAuthContext();
    const [adminState, setAdminState] = useState('checking'); // checking | yes | no

    useEffect(() => {
        if (status !== 'authenticated' || !user) return undefined;
        let cancelled = false;
        setAdminState('checking');
        supabase
            .rpc('is_admin')
            .then(({ data, error }) => {
                if (cancelled) return;
                setAdminState(!error && data ? 'yes' : 'no');
            })
            .catch(() => {
                if (!cancelled) setAdminState('no');
            });
        return () => {
            cancelled = true;
        };
    }, [user, status]);

    if (adminState === 'checking') return <PageLoader message="Checking access…" />;
    if (adminState === 'no') return <Navigate to="/dashboard" replace />;
    return children;
}

export default function RequireAdmin({ children }) {
    return (
        <RequireAuth>
            <AdminGate>{children}</AdminGate>
        </RequireAuth>
    );
}
