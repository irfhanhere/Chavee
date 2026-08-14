import { supabase } from '../supabaseClient.js';

export const ATTACHMENT_BUCKET = 'message-attachments';
export const ATTACHMENT_SIGNED_URL_TTL = 86400; // 24 hours

export function normalizeAttachmentPath(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname;
      const segments = pathname.split('/').filter(Boolean);
      const bucketIndex = segments.indexOf(ATTACHMENT_BUCKET);

      if (bucketIndex !== -1 && bucketIndex + 1 < segments.length) {
        return decodeURIComponent(segments.slice(bucketIndex + 1).join('/'));
      }

      const objectMatch = pathname.match(/\/object\/(?:public|sign(?:\/[^/]+)?)\/([^/]+)\/(.+)$/);
      if (objectMatch) {
        return decodeURIComponent(objectMatch[2]);
      }
    } catch {
      // Fall back to original value if URL cannot be parsed
    }
    return trimmed;
  }

  return trimmed;
}

// Turns an arbitrary user-supplied filename into a safe storage object-key
// segment. Found via a real failure: "Collect moments...jpg" (multiple
// consecutive dots from an ellipsis) was uploaded with only whitespace
// replaced, producing a key containing ".." — Supabase Storage's server-side
// key validator rejects that as a path-traversal pattern regardless of where
// it falls in the string, so the upload failed before it ever reached the
// bucket. Keep the *original* name in display columns (e.g.
// gig_delivery_files.file_name) — only the storage key needs this.
export function sanitizeFilenameForStorageKey(name, { maxLength = 100 } = {}) {
  if (typeof name !== 'string' || !name.trim()) return 'file';

  // Anything outside letters/digits/dot/hyphen/underscore becomes '_'.
  let safe = name.trim().replace(/[^A-Za-z0-9._-]+/g, '_');

  // Collapse repeated separators — this is what actually prevents the ".."
  // traversal pattern, not just cosmetics.
  safe = safe.replace(/\.{2,}/g, '.').replace(/_{2,}/g, '_').replace(/-{2,}/g, '-');

  // A leading '.' makes a hidden-file-looking key; strip leading separators.
  safe = safe.replace(/^[._-]+/, '');

  if (!safe) return 'file';

  if (safe.length > maxLength) {
    const dotIndex = safe.lastIndexOf('.');
    const hasShortExt = dotIndex > 0 && safe.length - dotIndex <= 10;
    safe = hasShortExt
      ? safe.slice(0, maxLength - (safe.length - dotIndex)) + safe.slice(dotIndex)
      : safe.slice(0, maxLength);
  }

  return safe;
}

// bucket/ttl as an options object (not positional) so every existing call —
// getAttachmentSignedUrl(value) — keeps working unchanged. Added so the
// gig-delivery protection work (DeliveryFiles.jsx) can reuse this exact
// pattern against the gig-deliveries / gig-delivery-previews buckets
// instead of inventing a second signed-URL implementation.
export async function getAttachmentSignedUrl(value, { bucket = ATTACHMENT_BUCKET, ttl = ATTACHMENT_SIGNED_URL_TTL } = {}) {
  const normalizedPath = normalizeAttachmentPath(value);
  if (!normalizedPath) return '';

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedPath, ttl);

  if (error) {
    console.error('Error generating attachment signed URL:', error);
    return value;
  }
  return data?.signedUrl || value;
}
