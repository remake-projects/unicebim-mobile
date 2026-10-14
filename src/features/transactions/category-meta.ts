import { TRANSFER_CATEGORY } from '@/core/categories';

/** Emoji shown next to each category id (language neutral, no icon font needed). */
const CATEGORY_EMOJI: Record<string, string> = {
  scholarship: '🎓',
  family: '👪',
  job: '💼',
  social: '🎉',
  food: '🍔',
  transport: '🚌',
  bills: '🏠',
  education: '📚',
  other: '🧾',
  [TRANSFER_CATEGORY]: '🔁',
};

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? CATEGORY_EMOJI.other!;
}
