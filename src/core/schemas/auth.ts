import { z } from 'zod';

import { PASSWORD_MIN_LENGTH, V } from '../validation';
import { fullName } from './profile';

const email = z.string().trim().pipe(z.email({ error: V.invalidEmail }));
const password = z.string().min(PASSWORD_MIN_LENGTH, V.passwordTooShort);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, V.required),
});

export const registerSchema = z
  .object({
    fullName,
    email,
    password,
    passwordConfirm: z.string(),
    acceptTerms: z.boolean().refine((v) => v, V.termsRequired),
  })
  .refine((v) => v.password === v.passwordConfirm, { message: V.passwordsDontMatch, path: ['passwordConfirm'] });

export const resetPasswordRequestSchema = z.object({ email });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, V.required),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: V.passwordsDontMatch, path: ['confirmPassword'] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: V.passwordUnchanged, path: ['newPassword'] });

/** Setting a new password after a reset link (no current password available). */
export const newPasswordSchema = z
  .object({ newPassword: password, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { message: V.passwordsDontMatch, path: ['confirmPassword'] });

/** Re-entering the password before the account is deleted. */
export const deleteAccountSchema = z.object({ password: z.string().min(1, V.required) });

export type LoginInput = z.output<typeof loginSchema>;
export type RegisterFormInput = z.input<typeof registerSchema>;
export type RegisterInput = z.output<typeof registerSchema>;
export type ChangePasswordInput = z.output<typeof changePasswordSchema>;
export type NewPasswordInput = z.output<typeof newPasswordSchema>;
export type DeleteAccountInput = z.output<typeof deleteAccountSchema>;
