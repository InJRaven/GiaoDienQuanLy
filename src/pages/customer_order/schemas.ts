import { z } from 'zod';

/**
 * Zod Schema for Creating a Customer Order
 * Supports either:
 * - Option (a): selected accountId (from existing account lookup)
 * - Option (b): new account details (customerName, courseraAccount, optional password)
 */
export const createCustomerOrderSchema = z
  .object({
    accountId: z.number().nullable().optional(),
    customerName: z
      .string()
      .trim()
      .max(150, 'Tên khách hàng không quá 150 ký tự')
      .optional()
      .default(''),
    courseraAccount: z
      .string()
      .trim()
      .max(255, 'Tài khoản không quá 255 ký tự')
      .optional()
      .default(''),
    password: z
      .string()
      .max(255, 'Mật khẩu không quá 255 ký tự')
      .optional()
      .default(''),
    courseId: z
      .string()
      .min(1, 'Vui lòng chọn môn học')
      .refine((val) => Number(val) > 0, 'Vui lòng chọn môn học'),
    price: z
      .string()
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        'Giá tiền phải là số hợp lệ không âm',
      ),
    assignedUserId: z.string().default('none'),
    isCompleted: z.boolean().default(false),
    hasCertificate: z.boolean().default(false),
    isPaid: z.boolean().default(false),
    note: z.string().max(1000, 'Ghi chú tối đa 1000 ký tự').optional().default(''),
  })
  .superRefine((data, ctx) => {
    // If no existing account was chosen, customerName and courseraAccount are mandatory
    if (!data.accountId) {
      if (!data.customerName || data.customerName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customerName'],
          message: 'Tên khách hàng là bắt buộc',
        });
      }
      if (!data.courseraAccount || data.courseraAccount.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['courseraAccount'],
          message: 'Tài khoản Coursera là bắt buộc',
        });
      }
    }
  });

export type CreateCustomerOrderFormValues = z.infer<
  typeof createCustomerOrderSchema
>;

/**
 * Zod Schema for Updating a Customer Order
 * CRITICAL: Strictly forbids customerName, courseraAccount, password
 * to prevent NestJS Whitelist ValidationPipe from throwing 400!
 */
export const updateCustomerOrderSchema = z.object({
  courseId: z
    .string()
    .min(1, 'Vui lòng chọn môn học')
    .refine((val) => Number(val) > 0, 'Vui lòng chọn môn học'),
  price: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      'Giá tiền phải là số hợp lệ không âm',
    ),
  assignedUserId: z.string().default('none'),
  isCompleted: z.boolean().default(false),
  hasCertificate: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  note: z.string().max(1000, 'Ghi chú tối đa 1000 ký tự').optional().default(''),
  accountId: z.number().optional(),
});

export type UpdateCustomerOrderFormValues = z.infer<
  typeof updateCustomerOrderSchema
>;

/**
 * Zod Schema for Creating a Standalone Coursera Account
 */
export const createCustomerAccountSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, 'Tên khách hàng là bắt buộc')
    .max(150, 'Tên khách không quá 150 ký tự'),
  courseraAccount: z
    .string()
    .trim()
    .min(1, 'Tài khoản Coursera là bắt buộc')
    .max(255, 'Tài khoản không quá 255 ký tự'),
  password: z
    .string()
    .max(255, 'Mật khẩu không quá 255 ký tự')
    .optional()
    .default(''),
  note: z.string().max(1000, 'Ghi chú tối đa 1000 ký tự').optional().default(''),
});

export type CreateCustomerAccountFormValues = z.infer<
  typeof createCustomerAccountSchema
>;

/**
 * Zod Schema for Updating a Coursera Account
 */
export const updateCustomerAccountSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(1, 'Tên khách hàng là bắt buộc')
      .max(150, 'Tên khách không quá 150 ký tự'),
    courseraAccount: z
      .string()
      .trim()
      .min(1, 'Tài khoản Coursera là bắt buộc')
      .max(255, 'Tài khoản không quá 255 ký tự'),
    passwordAction: z.enum(['keep', 'change', 'delete']).default('keep'),
    password: z
      .string()
      .max(255, 'Mật khẩu không quá 255 ký tự')
      .optional()
      .default(''),
    note: z.string().max(1000, 'Ghi chú tối đa 1000 ký tự').optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (
      data.passwordAction === 'change' &&
      (!data.password || data.password.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Vui lòng nhập mật khẩu mới hoặc chọn "Giữ nguyên"',
      });
    }
  });

export type UpdateCustomerAccountFormValues = z.infer<
  typeof updateCustomerAccountSchema
>;
