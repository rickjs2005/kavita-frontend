// src/utils/imageUrl.ts
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

/**
 * Resolves any raw image path/URL to a fully-qualified URL string.
 *
 * Handles:
 * - null / undefined / empty  → ""
 * - data: URIs                → returned as-is
 * - absolute http/https URLs  → returned as-is
 * - paths starting with "/"   → prefixed with API base
 * - paths starting with "uploads/" or "public/" → prefixed with API base
 * - bare filenames            → prefixed with "{API}/uploads/"
 */
export function resolveImageUrl(raw?: string | null): string {
  if (!raw) return "";

  const src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return "";

  // data URL – return unchanged
  if (src.startsWith("data:")) return src;

  // absolute URL – return unchanged
  if (/^https?:\/\//i.test(src)) return src;

  // relative path starting with "/"
  if (src.startsWith("/")) {
    return `${API}${src}`;
  }

  // already has uploads/ or public/ prefix
  if (src.startsWith("uploads/") || src.startsWith("public/")) {
    return `${API}/${src}`;
  }

  // bare filename – assume uploads/
  return `${API}/uploads/${src}`;
}
