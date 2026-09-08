const STORAGE_KEY = 'chavee_cookie_consent_v1';

export const CATEGORY_INFO = [
    {
        key: 'essential',
        label: 'Essential',
        locked: true,
        description:
            'Required for the site to work — keeping you signed in and protecting forms from bots. Always on.',
    },
    {
        key: 'functional',
        label: 'Functional',
        locked: false,
        description:
            'Remembers preferences like your theme and last-used filters so the app feels consistent between visits.',
    },
    {
        key: 'analytics',
        label: 'Analytics',
        locked: false,
        description:
            'Would let us measure which features are used so we can improve them. Chavee sets no analytics cookies today; this covers any we add later.',
    },
];

// Reject-all by default — nothing beyond "essential" is on until the user
// makes a choice.
const DEFAULT = { essential: true, functional: false, analytics: false };

/** The stored choice, or null if the user hasn't chosen yet. */
export function getConsent() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return { ...DEFAULT, ...parsed, essential: true };
    } catch {
        return null; // storage blocked -> treat as "no choice", banner shows
    }
}

export function hasChosen() {
    return getConsent() !== null;
}

/** True for 'essential' always; for others only if the user opted in. */
export function isAllowed(category) {
    if (category === 'essential') return true;
    const c = getConsent();
    return !!(c && c[category]);
}

export function setConsent(choice) {
    const next = { ...DEFAULT, ...choice, essential: true };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        /* noop — choice just won't persist */
    }
    try {
        window.dispatchEvent(new CustomEvent('chavee:cookie-consent', { detail: next }));
    } catch {
        /* noop */
    }
    return next;
}

export const acceptAll = () => setConsent({ functional: true, analytics: true });
export const rejectAll = () => setConsent({ functional: false, analytics: false });

/** Footer "Cookie settings" link calls this to re-open the banner. */
export function openCookieSettings() {
    try {
        window.dispatchEvent(new CustomEvent('chavee:open-cookie-settings'));
    } catch {
        /* noop */
    }
}
