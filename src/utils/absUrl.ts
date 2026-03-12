const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export function absUrl(raw?: string | null): string {
  console.log(`[TRACE][absUrl] INPUT: ${raw ?? "(null/undefined)"} (length: ${raw != null ? String(raw).length : 0})`);

  if (!raw) {
    console.log("[TRACE][absUrl] OUTPUT: /placeholder.png (raw was falsy)");
    return "/placeholder.png";
  }

  let src = String(raw).trim().replace(/\\/g, "/");
  if (!src) {
    console.log("[TRACE][absUrl] OUTPUT: /placeholder.png (src became empty)");
    return "/placeholder.png";
  }

  // data URL
  if (src.startsWith("data:")) {
    console.log(`[TRACE][absUrl] OUTPUT (data URL): ${src} (length: ${src.length})`);
    return src;
  }

  // URL absoluta
  if (/^https?:\/\//i.test(src)) {
    console.log(`[TRACE][absUrl] OUTPUT (already absolute): ${src} (length: ${src.length})`);
    return src;
  }

  // remove barras iniciais
  src = src.replace(/^\/+/, "");

  // já veio completo com uploads/
  if (src.startsWith("uploads/")) {
    const out = `${API}/${src}`;
    console.log(`[TRACE][absUrl] OUTPUT (uploads/): ${out} (length: ${out.length})`);
    return out;
  }

  // veio só a subpasta/arquivo, ex: products/x.jpg
  if (
    src.startsWith("products/") ||
    src.startsWith("colaboradores/") ||
    src.startsWith("logos/") ||
    src.startsWith("news/") ||
    src.startsWith("drones/")
  ) {
    const out = `${API}/uploads/${src}`;
    console.log(`[TRACE][absUrl] OUTPUT (subpath): ${out} (length: ${out.length})`);
    return out;
  }

  // veio só nome de arquivo
  const out = `${API}/uploads/${src}`;
  console.log(`[TRACE][absUrl] OUTPUT (fallback): ${out} (length: ${out.length})`);
  return out;
}