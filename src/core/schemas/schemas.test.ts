import { describe, expect, it } from 'vitest';

import { V } from '../validation';
import { changePasswordSchema, newPasswordSchema, registerSchema } from './auth';
import { makePaymentSchema } from './planning';
import { budgetSettingsSchema, onboardingSchema } from './profile';
import { transactionSchema } from './transaction';
import { transferSchema } from './wallet';

const WALLET_A = '0b7f3c1e-1d2a-4c3b-9e8f-111111111111';
const WALLET_B = '0b7f3c1e-1d2a-4c3b-9e8f-222222222222';

function codes(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : result.error!.issues.map((i) => i.message);
}

describe('transactionSchema', () => {
  const base = { amount: '1.250,50', type: 'expense', category: 'food', date: '2026-10-13' };

  it('parses localized amounts and normalizes optional fields', () => {
    const r = transactionSchema.parse({ ...base, description: '  ', walletId: undefined });
    expect(r).toMatchObject({ amount: 1250.5, description: null, walletId: null });
  });

  it('rejects categories that do not match the type', () => {
    expect(codes(transactionSchema.safeParse({ ...base, type: 'income' }))).toContain(V.invalidCategory);
  });

  it('never accepts the transfer category from forms', () => {
    expect(codes(transactionSchema.safeParse({ ...base, category: 'transfer' }))).toContain(V.invalidCategory);
  });

  it('rejects non-positive and invalid amounts', () => {
    expect(codes(transactionSchema.safeParse({ ...base, amount: '0' }))).toContain(V.amountPositive);
    expect(codes(transactionSchema.safeParse({ ...base, amount: 'abc' }))).toContain(V.invalidAmount);
  });
});

describe('transferSchema', () => {
  it('rejects transfers to the same wallet', () => {
    const r = transferSchema.safeParse({ fromWalletId: WALLET_A, toWalletId: WALLET_A, amount: 10, date: '2026-10-13' });
    expect(codes(r)).toContain(V.sameWallet);
    expect(transferSchema.safeParse({ fromWalletId: WALLET_A, toWalletId: WALLET_B, amount: 10, date: '2026-10-13' }).success).toBe(true);
  });
});

describe('makePaymentSchema', () => {
  it('rejects due dates before today', () => {
    const schema = makePaymentSchema('2026-10-13');
    expect(codes(schema.safeParse({ name: 'Kira', amount: 100, dueDate: '2026-10-12' }))).toContain(V.dateInPast);
    expect(schema.safeParse({ name: 'Kira', amount: 100, dueDate: '2026-10-13' }).success).toBe(true);
  });
});

describe('budgetSettingsSchema', () => {
  it('treats empty inputs as unset', () => {
    expect(budgetSettingsSchema.parse({ monthlyBudgetGoal: '', nextIncomeDate: '', mealPrice: '' })).toEqual({
      monthlyBudgetGoal: null,
      nextIncomeDate: null,
      mealPrice: null,
    });
  });
});

describe('auth schemas', () => {
  it('requires matching passwords and accepted terms', () => {
    const r = registerSchema.safeParse({
      fullName: 'Ada',
      email: 'ada@example.com',
      password: 'password1',
      passwordConfirm: 'password2',
      acceptTerms: false,
    });
    expect(codes(r)).toEqual(expect.arrayContaining([V.passwordsDontMatch, V.termsRequired]));
  });

  it('rejects an unchanged password', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'password1', newPassword: 'password1', confirmPassword: 'password1' });
    expect(codes(r)).toContain(V.passwordUnchanged);
  });

  it('requires a confirmed new password after a reset', () => {
    expect(codes(newPasswordSchema.safeParse({ newPassword: 'password1', confirmPassword: 'password2' }))).toContain(V.passwordsDontMatch);
    expect(codes(newPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' }))).toContain(V.passwordTooShort);
  });
});

describe('onboardingSchema', () => {
  it('requires a budget goal and accepts empty optional fields', () => {
    expect(onboardingSchema.safeParse({ monthlyBudgetGoal: '', nextIncomeDate: '', mealPrice: '' }).success).toBe(false);
    expect(onboardingSchema.parse({ monthlyBudgetGoal: '4500', nextIncomeDate: '', mealPrice: '' })).toEqual({
      monthlyBudgetGoal: 4500,
      nextIncomeDate: null,
      mealPrice: null,
    });
  });
});
