export type EmploymentStatus = 'active' | 'on_leave' | 'terminated';

export interface UserRole {
  id: number;
  name: string;
  description?: string;
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

export interface UserListItem {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  employeeCode: string | null;
  department: string | null;
  positionId: string | null;
  hireDate: string | null; // YYYY-MM-DD
  employmentStatus: EmploymentStatus;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: UserRole[];
}

export interface UserPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UserListResponse {
  items: UserListItem[];
  meta: UserPaginationMeta;
}

export interface CreateUserDto {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  employeeCode?: string;
  department?: string;
  hireDate?: string;
  employmentStatus?: EmploymentStatus;
  roleIds?: number[];
}

export interface UpdateUserDto {
  email?: string | null;
  fullName?: string | null;
  employeeCode?: string | null;
  department?: string | null;
  positionId?: string | null;
  hireDate?: string | null;
}

export interface UpdateUserStatusDto {
  isActive?: boolean;
  employmentStatus?: EmploymentStatus;
}

export interface ResetPasswordDto {
  password: string;
}

export interface ResetPasswordResponse {
  code: string;
  message: string;
  revokedSessions: number;
}

export type UserSortBy =
  | 'created_at'
  | 'username'
  | 'full_name'
  | 'employee_code'
  | 'department'
  | 'hire_date'
  | 'last_login_at';

export interface UserFilterParams {
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  sortBy?: UserSortBy;
  search?: string;
  isActive?: boolean;
  employmentStatus?: EmploymentStatus;
  roleId?: number;
  unassigned?: boolean;
}

export interface ApiErrorResponse {
  statusCode?: number;
  code?: string;
  message: string;
  details?: {
    fields?: string[];
    resource?: string;
  };
}
