import { useState, useEffect } from 'react';

/**
 * useIsMobile — true when the viewport is at or below `breakpoint` (default
 * 768px, matching the max-width: 768px breakpoint already used elsewhere in
 * this codebase, e.g. Navbar.jsx's .hidden-mobile/.show-mobile toggle).
 * Listens for resize so it stays correct across orientation changes/resizing,
 * not just the width at first mount.
 */
export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
    );

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [breakpoint]);

    return isMobile;
}
