import { z } from 'zod';

const baseMenuItemShape = {
  type: z.enum(['item', 'heading', 'separator']).default('item'),
  title: z
    .string()
    .trim()
    .max(100, 'Title cannot exceed 100 characters')
    .optional()
    .default(''),
  path: z
    .string()
    .trim()
    .max(255, 'Path cannot exceed 255 characters')
    .optional()
    .default(''),
  icon: z.string().nullable().optional(),
  badge: z
    .string()
    .max(50, 'Badge cannot exceed 50 characters')
    .optional()
    .default(''),
  badgeVariant: z.string().nullable().optional(),
  permissionId: z.coerce.number().nullable().optional(),
  parentId: z.coerce.number().nullable().optional(),
  isExternal: z.boolean().default(false),
  isCollapse: z.boolean().default(false),
  collapseTitle: z.string().optional().default(''),
  expandTitle: z.string().optional().default(''),
};

const validateMenuRefinements = (
  data: {
    type: string;
    title?: string;
    path?: string;
    isExternal?: boolean;
    isCollapse?: boolean;
  },
  ctx: z.RefinementCtx,
) => {
  if (data.type === 'item') {
    if (!data.title || data.title.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Menu item must have a title',
      });
    }
    if (data.isExternal) {
      if (!data.path || data.path.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['path'],
          message: 'External link must have a path',
        });
      } else if (!/^https?:\/\//i.test(data.path.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['path'],
          message: 'External link must start with http:// or https://',
        });
      }
    }
    if (data.isCollapse && data.path && data.path.trim() !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['path'],
        message: 'Collapsed group item cannot have a path',
      });
    }
  } else if (data.type === 'heading') {
    if (data.path && data.path.trim() !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['path'],
        message: 'Heading cannot have a path',
      });
    }
  } else if (data.type === 'separator') {
    if (data.path && data.path.trim() !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['path'],
        message: 'Separator cannot have a path',
      });
    }
  }
};

export const createMenuItemSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, 'Identifier Key là bắt buộc')
      .max(100, 'Key cannot exceed 100 characters')
      .regex(
        /^[a-z][a-z0-9_]*$/,
        'Key must contain only lowercase letters, numbers, underscores and start with a letter (vd: cs_subjects)',
      ),
    ...baseMenuItemShape,
  })
  .superRefine(validateMenuRefinements);

export const updateMenuItemSchema = z
  .object(baseMenuItemShape)
  .superRefine(validateMenuRefinements);

export const menuItemSchema = z
  .object({
    key: z
      .string()
      .trim()
      .max(100, 'Key cannot exceed 100 characters')
      .optional()
      .default(''),
    ...baseMenuItemShape,
  })
  .superRefine(validateMenuRefinements);

export type CreateMenuItemFormValues = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemFormValues = z.infer<typeof updateMenuItemSchema>;
export type MenuItemFormValues = z.infer<typeof menuItemSchema>;
