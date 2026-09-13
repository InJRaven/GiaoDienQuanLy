export type MenuItemType = 'item' | 'heading' | 'separator';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'warning'
  | 'info';

export interface AdminMenuItem {
  id: number;
  key: string;
  parentId: number | null;
  type: MenuItemType;
  title: string | null;
  path: string | null;
  icon: string | null;
  badge: string | null;
  badgeVariant: BadgeVariant | string | null;
  permissionId: number | null;
  permission: string | null; // For display only; sent as permissionId
  sortOrder: number;
  isActive: boolean;
  isExternal: boolean;
  isCollapse: boolean;
  collapseTitle: string | null;
  expandTitle: string | null;
  children: AdminMenuItem[];
}

export interface PermissionOption {
  id: number;
  code: string; // e.g. "users:view"
  module?: string;
  action?: string;
  name?: string; // fallback
  description?: string;
}

export interface CreateMenuItemDto {
  key: string;
  parentId?: number | null;
  type: MenuItemType;
  title?: string | null;
  path?: string | null;
  icon?: string | null;
  badge?: string | null;
  badgeVariant?: string | null;
  permissionId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
  isExternal?: boolean;
  isCollapse?: boolean;
  collapseTitle?: string | null;
  expandTitle?: string | null;
}

export interface UpdateMenuItemDto {
  title?: string | null;
  parentId?: number | null;
  type?: MenuItemType;
  path?: string | null;
  icon?: string | null;
  badge?: string | null;
  badgeVariant?: string | null;
  permissionId?: number | null;
  isActive?: boolean;
  isExternal?: boolean;
  isCollapse?: boolean;
  collapseTitle?: string | null;
  expandTitle?: string | null;
}

export interface ReorderMenuItemDto {
  items: {
    id: number;
    parentId: number | null;
    sortOrder: number;
  }[];
}
