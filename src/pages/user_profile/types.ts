import { PositionOption } from '@/pages/users/types';

export interface UserProfileData {
  phone?: string | null;
  avatarUrl?: string | null;
  idCardNumber?: string | null;
  dateOfBirth?: string | null; // YYYY-MM-DD
  address?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
}

export interface UserProfileResponse {
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
  employmentStatus: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles?: Array<{ id: number; name: string; description?: string } | string>;
  profile?: UserProfileData;
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

export interface EmailVerificationRequestResponse {
  code: 'VERIFICATION_CODE_SENT' | 'EMAIL_ALREADY_VERIFIED' | 'NO_EMAIL_ON_FILE' | string;
  message: string;
  expiresInMinutes?: number;
}

export interface EmailVerificationConfirmResponse {
  code: 'EMAIL_VERIFIED' | 'EMAIL_ALREADY_VERIFIED' | string;
  message: string;
  emailVerified: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateMyProfileDto {
  profile: {
    phone?: string | null;
    avatarUrl?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
  };
}

export interface UpdateUserProfileDto {
  profile: {
    phone?: string | null;
    avatarUrl?: string | null;
    idCardNumber?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    bankAccount?: string | null;
    bankName?: string | null;
  };
}
