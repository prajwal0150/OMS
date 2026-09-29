import { z } from 'zod';
import { emailSchema, requiredString } from '../../shared/validation';
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from '../../utils/password';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .refine(isStrongPassword, { message: PASSWORD_POLICY_MESSAGE });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(10).optional(),
  })
  .default({});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(8).optional(),
  })
  .refine(
    (data) => !data.confirmPassword || data.confirmPassword === data.newPassword,
    { message: 'Passwords do not match', path: ['confirmPassword'] },
  );

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: requiredString(20, 300),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(8).optional(),
  })
  .refine(
    (data) => !data.confirmPassword || data.confirmPassword === data.newPassword,
    { message: 'Passwords do not match', path: ['confirmPassword'] },
  );

export const updateProfileSchema = z.object({
  phone: z.string().trim().max(20).optional(),
  profilePhoto: z.string().trim().max(400).optional(),
  firstName: requiredString(1, 60).optional(),
  middleName: z.string().trim().max(60).optional(),
  lastName: requiredString(1, 60).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

