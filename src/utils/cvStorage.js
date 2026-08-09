import { supabase } from '../supabaseClient.js';

export const CV_BUCKET = 'job-cvs';
export const CV_SIGNED_URL_TTL = 3600;

function decodeStoragePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeCvStoragePath(value) {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname;
      const segments = pathname.split('/').filter(Boolean);
      const bucketIndex = segments.indexOf(CV_BUCKET);

      if (bucketIndex !== -1 && bucketIndex + 1 < segments.length) {
        return decodeStoragePath(segments.slice(bucketIndex + 1).join('/'));
      }

      const objectMatch = pathname.match(/\/object\/(?:public|sign(?:\/[^/]+)?)\/([^/]+)\/(.+)$/);
      if (objectMatch) {
        return decodeStoragePath(objectMatch[2]);
      }
    } catch {
      // Fall back to the original value if the URL cannot be parsed.
    }

    return trimmed;
  }

  return trimmed;
}

export async function getCvSignedUrl(value, ttl = CV_SIGNED_URL_TTL) {
  const normalizedPath = normalizeCvStoragePath(value);
  if (!normalizedPath) return '';

  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(normalizedPath, ttl);

  if (error) throw error;
  return data?.signedUrl || '';
}
