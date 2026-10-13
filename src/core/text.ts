/**
 * Lower-case, strip diacritics and punctuation so "MİGROS TİC.", "Migros" and "migros"
 * compare equal. Turkish dotless/dotted i fold to plain "i".
 */
export function normalizeForMatching(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** True when `keyword` (one or more words) starts at a word boundary in `normalizedText`. */
export function containsKeyword(normalizedText: string, keyword: string): boolean {
  const k = normalizeForMatching(keyword);
  return k.length > 0 && ` ${normalizedText}`.includes(` ${k}`);
}
