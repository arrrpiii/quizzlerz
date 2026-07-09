export const PREDEFINED_TAGS = [
  "geography", "education", "technology", "ai", "nature", "politics",
  "art", "music", "dance", "lifestyle", "television",
];

export function normalizeTag(t) {
  return (t || "").trim().toLowerCase().replace(/\s+/g, "-");
}

export function cleanTags(tags) {
  const seen = new Set();
  const out = [];
  for (const t of tags || []) {
    const n = normalizeTag(t);
    if (n && !seen.has(n) && n.length <= 30) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}