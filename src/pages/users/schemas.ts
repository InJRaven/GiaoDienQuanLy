import { z } from 'zod';

export const userProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^(0|\+84)[0-9]{9,11}$/,
      'Số điện thoại phải là số Việt Nam (bắt đầu 0 hoặc +84, 9-11 số)',
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
    .regex(/^([0-9]{9}|[0-9]{12})$/, 'CMND/CCCD phải là đúng 9 hoặc 12 chữ số')
    .or(z.literal(''))
    .nullable()
    .optional(),
  dateOfBirth: z
    .string()
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
    .regex(
      /^[0-9]{6,30}$/,
      'Số tài khoản ngân hàng chỉ gồm chữ số (6-30 ký tự)',
    )
    .or(z.literal(''))
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

export type UserProfileFormValues = z.infer<typeof userProfileSchema>;

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be between 3 and 50 characters')
    .max(50, 'Username must be between 3 and 50 characters')
    .regex(
      /^[A-Za-z0-9._-]+$/,
      'Only letters, numbers, and characters . _ - are allowed',
    ),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .trim()
    .min(1, 'Email là bắt buộc')
    .email('Địa chỉ email không đúng định dạng'),
  employeeCode: z
    .string()
    .trim()
    .max(50, 'Employee code cannot exceed 50 characters')
    .optional()
    .default(''),
  department: z
    .string()
    .trim()
    .max(100, 'Department cannot exceed 100 characters')
    .optional()
    .default(''),
  positionId: z.coerce.number().nullable().optional(),
  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .or(z.literal(''))
    .optional()
    .default(''),
  employmentStatus: z
    .enum(['active', 'on_leave', 'terminated'])
    .default('active'),
  roleIds: z.array(z.number()).default([]),
  profile: userProfileSchema.optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address format')
    .or(z.literal(''))
    .optional()
    .default(''),
  employeeCode: z
    .string()
    .trim()
    .max(50, 'Employee code cannot exceed 50 characters')
    .optional()
    .default(''),
  department: z
    .string()
    .trim()
    .max(100, 'Department cannot exceed 100 characters')
    .optional()
    .default(''),
  positionId: z.coerce.number().nullable().optional(),
  hireDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .or(z.literal(''))
    .optional()
    .default(''),
  profile: userProfileSchema.optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(100, 'Password cannot exceed 100 characters'),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  employmentStatus: z.enum(['active', 'on_leave', 'terminated']).optional(),
});

export type UpdateUserStatusFormValues = z.infer<typeof updateUserStatusSchema>;

export const assignUserRolesSchema = z.object({
  roleIds: z.array(z.number()),
});

export type AssignUserRolesFormValues = z.infer<typeof assignUserRolesSchema>;

// -------------------------------------------------------------
// Collaborator Schemas
// -------------------------------------------------------------

export const createCollaboratorSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Họ và tên cộng tác viên là bắt buộc')
    .max(150, 'Họ và tên không được vượt quá 150 ký tự'),
  phone: z
    .string()
    .trim()
    .regex(
      /^(0|\+84)[0-9]{9,11}$/,
      'Số điện thoại phải là số Việt Nam (bắt đầu bằng 0 hoặc +84, gồm 9-11 chữ số)',
    )
    .or(z.literal(''))
    .optional()
    .nullable(),
  note: z
    .string()
    .trim()
    .max(2000, 'Ghi chú không được vượt quá 2000 ký tự')
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export type CreateCollaboratorFormValues = z.infer<
  typeof createCollaboratorSchema
>;

export const updateCollaboratorSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Họ và tên cộng tác viên không được để trống')
    .max(150, 'Họ và tên không được vượt quá 150 ký tự')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(
      /^(0|\+84)[0-9]{9,11}$/,
      'Số điện thoại phải là số Việt Nam (bắt đầu bằng 0 hoặc +84, gồm 9-11 chữ số)',
    )
    .or(z.literal(''))
    .optional()
    .nullable(),
  note: z
    .string()
    .trim()
    .max(2000, 'Ghi chú không được vượt quá 2000 ký tự')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateCollaboratorFormValues = z.infer<
  typeof updateCollaboratorSchema
>;
