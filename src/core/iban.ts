/** Normalize: drop spaces, upper-case. */
export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase();
}

/**
 * ISO 13616 IBAN check (format + mod-97 checksum) for any country.
 * The web app only accepted Turkish IBANs and did not verify the checksum.
 */
export function isValidIban(input: string | null | undefined): boolean {
  if (!input) return false;
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/** Group in blocks of four for display: "TR33 0006 1005 …". */
export function formatIban(input: string): string {
  return normalizeIban(input).replace(/(.{4})(?=.)/g, '$1 ');
}

/** First IBAN-looking token inside free text (bank descriptions), normalized. */
export function extractIban(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.toUpperCase().match(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/);
  return match ? normalizeIban(match[0]) : null;
}
