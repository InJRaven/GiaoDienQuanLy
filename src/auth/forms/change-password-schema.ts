import { z } from 'zod';

export const getChangePasswordSchema = () => {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: 'Please enter your current password' }),
      newPassword: z
        .string()
        .min(12, { message: 'New password must be at least 12 characters' }),
      confirmPassword: z
        .string()
        .min(1, { message: 'Please confirm your new password' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    });
};

export type ChangePasswordSchemaType = z.infer<
  ReturnType<typeof getChangePasswordSchema>
>;
