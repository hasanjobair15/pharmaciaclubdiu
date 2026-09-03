/* Shared image helpers for the Pharmacia Club site.
 *
 * gallery.image_url / news.image_url are single URLs for legacy rows, but may
 * now also hold a JSON array string of URLs for multi-image posts. Everything
 * reads through parseImageList() so old and new rows display correctly.
 */

export function parseImageList(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return [];
  const v = String(imageUrl).trim();
  if (!v) return [];
  if (v.startsWith("[")) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
          .map((u) => u.trim());
      }
    } catch {
      /* fall through to single-URL handling */
    }
  }
  return [v];
}

/** Serialize for storage: single URL stays a plain string; multiple → JSON array. */
export function serializeImageList(urls: string[]): string | null {
  const clean = urls
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MAX_IMAGE_MB = 6;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return `"${file.name || "Pasted image"}" is not a supported image type. Use JPG, PNG, WebP, GIF or AVIF.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name || "Pasted image"}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_IMAGE_MB} MB.`;
  }
  return null;
}

export function imageExtensionFor(file: File): string {
  return MIME_EXT[file.type] ?? (file.name.split(".").pop() || "jpg").toLowerCase();
}

export function isValidImageUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Please paste an image URL.";
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return "That does not look like a valid URL — it should start with http:// or https://.";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Only http:// and https:// image URLs are allowed.";
  }
  return null;
}
