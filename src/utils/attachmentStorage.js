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

export async function getAttachmentSignedUrl(value, ttl = ATTACHMENT_SIGNED_URL_TTL) {
  const normalizedPath = normalizeAttachmentPath(value);
  if (!normalizedPath) return '';

  const { data, error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(normalizedPath, ttl);

  if (error) {
    console.error('Error generating attachment signed URL:', error);
    return value;
  }
  return data?.signedUrl || value;
}
