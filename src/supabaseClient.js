import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Resilient auth-session storage.
 *
 * A large share of our audience opens the app in contexts that block or
 * wipe localStorage between page loads:
 *   - iOS Safari with "Prevent Cross-Site Tracking" / "Block All Cookies"
 *   - In-app browsers (Instagram, Snapchat, Facebook, some WhatsApp)
 *   - Private windows under storage pressure
 * There, Supabase's persistSession writes nothing that survives a reload,
 * so the user appears logged out on every refresh / app-switch.
 *
 * We probe localStorage once at load. If it works we use it (still
 * wrapped, because Safari can begin throwing mid-session). If it does
 * not, we fall back to an in-memory store — the session then lasts only
 * as long as the tab — and broadcast `chavee:auth-storage-unavailable`
 * so the UI can warn the user. `isAuthStoragePersistent()` exposes the
 * current state for components that mount later.
 */
const memoryStore = new Map();
const memoryStorage = {
  getItem: (k) => (memoryStore.has(k) ? memoryStore.get(k) : null),
  setItem: (k, v) => { memoryStore.set(k, String(v)); },
  removeItem: (k) => { memoryStore.delete(k); },
};

const hasWindow = typeof window !== 'undefined';
let storagePersistent = false;

function localStorageWorks() {
  try {
    const probe = '__chavee_ls_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function broadcastStorageUnavailable() {
  if (!hasWindow) return;
  try {
    window.dispatchEvent(new CustomEvent('chavee:auth-storage-unavailable'));
  } catch {
    /* noop */
  }
}

let authStorage;
if (hasWindow && localStorageWorks()) {
  storagePersistent = true;
  authStorage = {
    getItem: (k) => {
      try { return window.localStorage.getItem(k); }
      catch { return memoryStorage.getItem(k); }
    },
    setItem: (k, v) => {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        // localStorage started throwing mid-session (quota, or the user
        // toggled tracking protection with the tab open). Downgrade.
        storagePersistent = false;
        memoryStorage.setItem(k, v);
        broadcastStorageUnavailable();
      }
    },
    removeItem: (k) => {
      try { window.localStorage.removeItem(k); }
      catch { memoryStorage.removeItem(k); }
    },
  };
} else {
  authStorage = memoryStorage;
  // Defer so listeners added during the first React render still catch it.
  if (hasWindow) setTimeout(broadcastStorageUnavailable, 0);
}

/** True while the auth session is being written to a durable store. */
export function isAuthStoragePersistent() {
  return storagePersistent;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: authStorage,
    // storageKey intentionally left unset — supabase-js derives the same
    // `sb-<ref>-auth-token` default; overriding it would orphan every
    // already-signed-in user's stored session.
  },
});

if (hasWindow) window.supabase = supabase;
