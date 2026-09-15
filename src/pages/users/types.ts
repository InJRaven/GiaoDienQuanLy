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

export interface UserProfile {
  phone?: string | null;
  avatarUrl?: string | null;
  idCardNumber?: string | null;
  dateOfBirth?: string | null; // YYYY-MM-DD
  address?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
}

export interface PositionOption {
  id: number;
  name: string;
  defaultSalary: string | null; // String from NUMERIC column
  description: string | null;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string | null;
  emailVerified?: boolean;
  mustChangePassword?: boolean;
  fullName: string;
  employeeCode: string | null;
  department: string | null;
  positionId: number | string | null;
  position?: PositionOption | null;
  hireDate: string | null; // YYYY-MM-DD
  employmentStatus: EmploymentStatus;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: UserRole[];
  profile?: UserProfile;
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
  positionId?: number | null;
  hireDate?: string;
  employmentStatus?: EmploymentStatus;
  roleIds?: number[];
  profile?: UserProfile;
}

export interface UpdateUserDto {
  email?: string | null;
  fullName?: string | null;
  employeeCode?: string | null;
  department?: string | null;
  positionId?: number | null;
  hireDate?: string | null;
  profile?: UserProfile | null;
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

// -------------------------------------------------------------
// Collaborator Types
// -------------------------------------------------------------

export interface CollaboratorItem {
  id: number;
  fullName: string;
  phone: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollaboratorPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CollaboratorListResponse {
  items: CollaboratorItem[];
  meta: CollaboratorPaginationMeta;
}

export interface CreateCollaboratorDto {
  fullName: string;
  phone?: string | null;
  note?: string | null;
  isActive?: boolean;
}

export interface UpdateCollaboratorDto {
  fullName?: string;
  phone?: string | null;
  note?: string | null;
  isActive?: boolean;
}

export type CollaboratorSortBy = 'full_name' | 'created_at' | 'updated_at';

export interface CollaboratorFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: CollaboratorSortBy;
  order?: 'asc' | 'desc';
}
