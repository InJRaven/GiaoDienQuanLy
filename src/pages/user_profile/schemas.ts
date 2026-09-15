import { z } from 'zod';

export const profileFormSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^(0|\+84)[0-9]{9,11}$/,
      'Số điện thoại phải bắt đầu bằng 0 hoặc +84 và gồm 9-11 chữ số',
    )
    .or(z.literal(''))
    .nullable()
    .optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(255, 'Avatar URL không vượt quá 255 ký tự')
    .or(z.literal(''))
    .nullable()
    .optional(),
  idCardNumber: z
    .string()
    .trim()
    .regex(/^([0-9]{9}|[0-9]{12})$/, 'CMND/CCCD phải đúng 9 hoặc 12 chữ số')
    .or(z.literal(''))
    .nullable()
    .optional(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải có định dạng YYYY-MM-DD')
    .or(z.literal(''))
    .nullable()
    .optional(),
  address: z
    .string()
    .trim()
    .max(500, 'Địa chỉ không vượt quá 500 ký tự')
    .or(z.literal(''))
    .nullable()
    .optional(),
  bankAccount: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s-]+/g, ''))
    .pipe(
      z
        .string()
        .regex(
          /^[0-9]{6,30}$/,
          'Số tài khoản ngân hàng chỉ gồm chữ số (6-30 ký tự)',
        )
        .or(z.literal('')),
    )
    .nullable()
    .optional(),
  bankName: z
    .string()
    .trim()
    .max(100, 'Tên ngân hàng không vượt quá 100 ký tự')
    .or(z.literal(''))
    .nullable()
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(12, 'Mật khẩu mới phải có ít nhất 12 ký tự')
      .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận lại mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, 'Mã xác thực gồm đúng 6 chữ số'),
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

/**
 * Clean and format profile fields before sending to API:
 * 1. dateOfBirth cut to YYYY-MM-DD
 * 2. bankAccount strip spaces and dashes
 * 3. "" converted to null
 */
export function sanitizeProfilePayload(
  values: ProfileFormValues,
  canEditAll: boolean,
) {
  const sanitizeValue = (val: string | null | undefined): string | null => {
    if (val === undefined || val === null) return null;
    const trimmed = String(val).trim();
    return trimmed === '' ? null : trimmed;
  };

  let formattedDob: string | null = null;
  if (values.dateOfBirth) {
    const dobStr = String(values.dateOfBirth).trim();
    if (dobStr.includes('T')) {
      formattedDob = dobStr.split('T')[0];
    } else if (dobStr.length >= 10) {
      formattedDob = dobStr.slice(0, 10);
    } else {
      formattedDob = dobStr || null;
    }
  }

  const base = {
    phone: sanitizeValue(values.phone),
    avatarUrl: sanitizeValue(values.avatarUrl),
    dateOfBirth: formattedDob,
    address: sanitizeValue(values.address),
  };

  if (!canEditAll) {
    // Only 4 fields can be updated when lacking users:update permission
    return { profile: base };
  }

  // With users:update permission, can update all 7 fields
  const cleanBankAccount = values.bankAccount
    ? sanitizeValue(values.bankAccount.replace(/[\s-]+/g, ''))
    : null;

  return {
    profile: {
      ...base,
      idCardNumber: sanitizeValue(values.idCardNumber),
      bankAccount: cleanBankAccount,
      bankName: sanitizeValue(values.bankName),
    },
  };
}
