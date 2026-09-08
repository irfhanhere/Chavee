const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';
let loadPromise = null;

/**
 * Lazily injects the Cashfree Drop-in SDK and resolves once
 * `window.Cashfree` is available. Safe to call repeatedly — the script is
 * only added once. Replaces the blocking <script> in index.html that
 * loaded (and phoned home) on every page.
 *
 * @returns {Promise<Function>} the global `Cashfree` factory
 */
export function loadCashfree() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('loadCashfree: no window'));
    }
    if (window.Cashfree) return Promise.resolve(window.Cashfree);
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
        const finish = () => {
            if (window.Cashfree) resolve(window.Cashfree);
            else reject(new Error('Cashfree SDK loaded but window.Cashfree is missing'));
        };
        const fail = () => {
            loadPromise = null; // allow a retry on the next attempt
            reject(new Error('Failed to load the Cashfree SDK'));
        };

        const existing = document.querySelector(`script[src="${SDK_URL}"]`);
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', fail, { once: true });
            if (window.Cashfree) resolve(window.Cashfree);
            return;
        }

        const s = document.createElement('script');
        s.src = SDK_URL;
        s.async = true;
        s.onload = finish;
        s.onerror = fail;
        document.head.appendChild(s);
    });

    return loadPromise;
}

export default loadCashfree;
