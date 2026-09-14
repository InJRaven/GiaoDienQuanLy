import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Role key must be between 2 and 50 characters')
    .max(50, 'Role key must be between 2 and 50 characters')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
    ),
  description: z
    .string()
    .trim()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .default(''),
  permissionIds: z.array(z.number()).default([]),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Role key must be between 2 and 50 characters')
    .max(50, 'Role key must be between 2 and 50 characters')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
    ),
  description: z
    .string()
    .trim()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .default(''),
});

export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>;
