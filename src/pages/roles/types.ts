export interface RoleItem {
  id: number;
  name: string;
  description?: string | null;
  permissionCount: number;
  userCount: number;
  isSystem: boolean;
}

export interface PermissionItem {
  id: number;
  code: string;
  module: string;
  action: string;
}

export interface RoleDetail extends RoleItem {
  permissions: PermissionItem[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface UpdateRolePermissionsDto {
  permissionIds: number[];
}

export function formatRoleName(name?: string | null): string {
  if (!name) return '';
  return name
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates a valid role business key from a human description.
 * e.g. "Kế toán trưởng, duyệt lương" -> "ke_toan_truong"
 * Only lowercase letters, numbers, underscores: ^[a-z][a-z0-9_]*$
 */
export function generateRoleKeyFromDescription(desc: string): string {
  if (!desc) return '';
  // Normalize and remove accents
  const normalized = desc
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();

  // Replace special chars and whitespace with underscore
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  // Must start with letter
  if (!slug) return '';
  if (/^[0-9]/.test(slug)) {
    return `role_${slug}`;
  }
  return slug;
}

/**
 * Explicit list of high-risk / critical administrative permissions.
 * These require distinct visual indicators in the matrix.
 */
export const SENSITIVE_PERMISSIONS: string[] = [
  'roles:manage',
  'menus:manage',
  'users:create',
  'users:delete',
  'customer_orders:view_credential',
  'collaborator_orders:view_credential',
];

export interface PermissionMeta {
  title: string;
  description?: string;
}

/**
 * Human-friendly title and descriptions for system permissions.
 */
export const PERMISSION_METADATA: Record<string, PermissionMeta> = {
  // Users module
  'users:view': {
    title: 'View Employees',
    description: 'View employee list, detailed profiles, and search records.',
  },
  'users:create': {
    title: 'Create Employee',
    description: 'Add new staff accounts and set initial passwords.',
  },
  'users:update': {
    title: 'Update Profile',
    description: 'Edit employee profile information and contact details.',
  },
  'users:delete': {
    title: 'Delete Employee',
    description: 'Permanently remove accounts that have no operational data.',
  },

  // Roles module
  'roles:view': {
    title: 'View Roles & Permissions',
    description: 'Inspect system roles and their assigned permission matrices.',
  },
  'roles:assign': {
    title: 'Assign Roles to Staff',
    description: 'Grant or revoke existing roles on employee accounts.',
  },
  'roles:manage': {
    title: 'Manage Roles & Matrix',
    description: 'Full administrative control over roles and permission matrices.',
  },

  // Menus module
  'menus:view': {
    title: 'View Menus',
    description: 'Inspect the navigation structure and menu items.',
  },
  'menus:manage': {
    title: 'Manage Navigation Menus',
    description: 'Create, update, reorder, and delete system navigation items.',
  },

  // Positions module
  'positions:view': {
    title: 'View Positions',
    description: 'View job positions and organizational titles.',
  },
  'positions:manage': {
    title: 'Manage Positions',
    description: 'Create, edit, and organize job position titles.',
  },

  // Courses module
  'courses:view': {
    title: 'View Courses',
    description: 'Browse available courses, subjects, and study materials.',
  },
  'courses:create': {
    title: 'Create Course',
    description: 'Create new courses, modules, and learning subjects.',
  },
  'courses:update': {
    title: 'Edit Course',
    description: 'Modify course content, pricing, and curriculum.',
  },
  'courses:delete': {
    title: 'Delete Course',
    description: 'Remove courses and curriculum from catalog.',
  },

  // Orders modules
  'customer_orders:view': {
    title: 'View Customer Orders',
    description: 'View customer purchase records and invoice status.',
  },
  'customer_orders:create': {
    title: 'Create Customer Order',
    description: 'Process and record new customer orders.',
  },
  'customer_orders:update': {
    title: 'Update Customer Order',
    description: 'Edit order status, items, or payment verification.',
  },
  'customer_orders:delete': {
    title: 'Delete Customer Order',
    description: 'Remove customer order records.',
  },
  'customer_orders:view_credential': {
    title: 'View Customer Credentials',
    description: 'Access sensitive customer account login credentials.',
  },

  'collaborator_orders:view': {
    title: 'View Collaborator Orders',
    description: 'Inspect orders generated by referral partners.',
  },
  'collaborator_orders:create': {
    title: 'Create Collaborator Order',
    description: 'Submit orders attributed to partners/collaborators.',
  },
  'collaborator_orders:update': {
    title: 'Update Collaborator Order',
    description: 'Modify partner order details and commission status.',
  },
  'collaborator_orders:delete': {
    title: 'Delete Collaborator Order',
    description: 'Remove collaborator order records.',
  },
  'collaborator_orders:view_credential': {
    title: 'View Collaborator Credentials',
    description: 'Access sensitive collaborator login credentials.',
  },
};

/**
 * Human-friendly labels for permission modules.
 */
export const MODULE_NAMES: Record<string, string> = {
  users: 'Employees & Users',
  roles: 'Roles & Access Control',
  menus: 'Navigation Menus',
  positions: 'Job Positions',
  courses: 'Courses & Education',
  customer_orders: 'Customer Orders',
  collaborator_orders: 'Collaborator Orders',
  attendance: 'Attendance & Timekeeping',
};
