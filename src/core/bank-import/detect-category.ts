import { categoriesFor, type TransactionType, type UserCategory } from '../categories';
import { containsKeyword, normalizeForMatching } from '../text';

/**
 * Keywords per category (matched at word starts, case/diacritic-insensitive).
 * Order matters: the first matching category of the transaction's type wins.
 */
const KEYWORDS: Record<Exclude<UserCategory, 'other'>, readonly string[]> = {
  scholarship: ['kyk', 'burs', 'scholarship', 'grant', 'stipend'],
  family: ['aile', 'harclik', 'allowance', 'pocket money'],
  job: ['maas', 'salary', 'payroll', 'freelance', 'ek is', 'part time', 'part-time', 'proje', 'project', 'gig'],
  social: [
    'starbucks', 'kahve', 'coffee', 'sinema', 'cinema', 'film', 'movie', 'konser', 'concert', 'eglence',
    'entertainment', 'oyun', 'game', 'steam', 'netflix', 'spotify', 'cafe', 'kafe', 'restoran', 'restaurant', 'pub',
  ],
  food: [
    'yemek', 'food', 'market', 'migros', 'bim', 'a101', 'sok', 'carrefour', 'yemekhane', 'cafeteria', 'mcdonald',
    'burger', 'pizza', 'dominos', 'getir', 'grocery', 'supermarket', 'lidl', 'aldi', 'tesco',
  ],
  transport: [
    'otobus', 'bus', 'metro', 'metrobus', 'tramvay', 'tram', 'taksi', 'taxi', 'uber', 'bitaksi', 'akbil',
    'istanbulkart', 'istanbul kart', 'bilet', 'ticket', 'transport', 'ulasim', 'train', 'tren',
  ],
  bills: [
    'kira', 'rent', 'fatura', 'bill', 'elektrik', 'electricity', 'dogalgaz', 'internet', 'telefon', 'phone',
    'abonelik', 'subscription', 'yurt', 'dorm', 'dormitory', 'turkcell', 'vodafone', 'turk telekom',
  ],
  education: [
    'okul', 'school', 'universite', 'university', 'kayit', 'registration', 'harc', 'tuition', 'kitap', 'book',
    'kirtasiye', 'stationery', 'ders', 'course', 'sinav', 'exam', 'udemy', 'coursera',
  ],
};

/** Best-guess category for a bank description; falls back to `other`. */
export function detectCategory(description: string | null | undefined, type: TransactionType): UserCategory {
  if (!description) return 'other';
  const text = normalizeForMatching(description);
  for (const category of categoriesFor(type)) {
    if (category === 'other') continue;
    if (KEYWORDS[category].some((k) => containsKeyword(text, k))) return category;
  }
  return 'other';
}
