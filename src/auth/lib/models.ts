// InJ Auth Contracts & Models based on PROMPT_FRONTEND.md

export interface LoginRequest {
  username: string;
  password: string;
  audience?: 'web' | 'extension';
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email?: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number; // in seconds
  user: AuthUser;
  roles: string[];
  permissions: string[];
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number; // in seconds
}

export interface SessionMeResponse {
  id: number;
  username: string;
  sessionId: string;
  jti: string;
  audience: string;
  roles: string[];
  permissions: string[];
}

export interface SessionItem {
  userId: number;
  sessionId: string;
  createdAt: number; // epoch ms
  lastUsedAt: number; // epoch ms
  userAgent: string;
  ip: string;
  audience: string;
  current: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  employeeCode: string | null;
  department: string | null;
  positionId: string | null;
  hireDate: string | null; // YYYY-MM-DD
  employmentStatus: string;
  isActive: boolean;
  lastLoginAt: string; // ISO 8601
  createdAt: string; // ISO 8601
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Backward-compatible UserModel for existing Metronic UI components
export interface UserModel {
  id?: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  fullname?: string;
  fullName?: string;
  roles?: string[] | number[];
  permissions?: string[];
  pic?: string;
  is_admin?: boolean;
}

export interface AuthModel {
  access_token: string;
  refresh_token?: string;
}
