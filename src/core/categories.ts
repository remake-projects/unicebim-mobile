/**
 * Language-neutral category ids. Display names come from i18n (`categories.<id>`).
 * Must stay in sync with the CHECK constraints in supabase/migrations.
 */
export const INCOME_CATEGORIES = ['scholarship', 'family', 'job', 'other'] as const;
export const EXPENSE_CATEGORIES = ['social', 'food', 'transport', 'bills', 'education', 'other'] as const;

/** Only used by wallet transfers; never selectable in forms. */
export const TRANSFER_CATEGORY = 'transfer';

export type TransactionType = 'income' | 'expense';
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type UserCategory = IncomeCategory | ExpenseCategory;

export const USER_CATEGORIES: readonly UserCategory[] = [
  ...new Set<UserCategory>([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]),
];

/** Expense category that represents recurring fixed costs (rent, bills, subscriptions). */
export const FIXED_EXPENSE_CATEGORY: ExpenseCategory = 'bills';

/** "Survival" spending vs. discretionary spending, used by the social score insight. */
export const ESSENTIAL_EXPENSE_CATEGORIES: readonly ExpenseCategory[] = ['food', 'transport', 'bills', 'education'];
export const DISCRETIONARY_EXPENSE_CATEGORIES: readonly ExpenseCategory[] = ['social'];

export function categoriesFor(type: TransactionType): readonly UserCategory[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function isCategoryForType(type: TransactionType, category: string): category is UserCategory {
  return (categoriesFor(type) as readonly string[]).includes(category);
}
