import { normalizeForMatching } from './text';

/** Services whose domain is not simply "<first word>.com". Keys are normalized names. */
const KNOWN_DOMAINS: Record<string, string> = {
  'amazon prime': 'amazon.com',
  'apple music': 'apple.com',
  'apple tv': 'apple.com',
  chatgpt: 'openai.com',
  disney: 'disneyplus.com',
  'game pass': 'xbox.com',
  icloud: 'apple.com',
  notion: 'notion.so',
  'prime video': 'amazon.com',
};

const NOISE_WORDS = new Set(['premium', 'pro', 'plus', 'family', 'aile', 'student', 'ogrenci', 'subscription', 'abonelik', 'uyelik']);

/** Best guess at a service's web domain from what the user typed ("Spotify Premium" → spotify.com). */
export function guessBrandDomain(name: string): string | null {
  const normalized = normalizeForMatching(name);
  for (const [key, domain] of Object.entries(KNOWN_DOMAINS)) {
    if (` ${normalized} `.includes(` ${key} `)) return domain;
  }
  const words = normalized.split(' ').filter((w) => w && !NOISE_WORDS.has(w));
  const slug = words.join('').replace(/[^a-z0-9]/g, '');
  return slug.length >= 2 ? `${slug}.com` : null;
}

/**
 * Logo URL for a subscription, or null when nothing can be guessed. unavatar.io answers 404 for
 * unknown domains (fallback=false), so the UI can show its own placeholder instead.
 */
export function brandIconUrl(name: string): string | null {
  const domain = guessBrandDomain(name);
  return domain ? `https://unavatar.io/${domain}?fallback=false` : null;
}
