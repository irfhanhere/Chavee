import { useAuthContext } from '../context/AuthContext.jsx';

/**
 * useAuth — thin shim over <AuthProvider> (src/context/AuthContext.jsx).
 *
 * Kept as a hook (rather than making every caller import useAuthContext)
 * so existing `const { user, loading, signOut } = useAuth()` call sites
 * keep working unchanged. New callers can also read
 * `{ status, session, isAuthenticated }`.
 *
 * status: 'loading' | 'authenticated' | 'unauthenticated' | 'unknown'
 */
export function useAuth() {
    return useAuthContext();
}

export default useAuth;
