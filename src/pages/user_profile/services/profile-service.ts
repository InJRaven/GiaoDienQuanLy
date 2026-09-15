import { api, apiClient } from '@/lib/axios.config';
import { PositionOption } from '@/pages/users/types';
import {
  ChangePasswordPayload,
  EmailVerificationConfirmResponse,
  EmailVerificationRequestResponse,
  SessionItem,
  UpdateMyProfileDto,
  UpdateUserProfileDto,
  UserProfileResponse,
} from '../types';

export const profileService = {
  /**
   * GET /users/me
   * Complete employee profile information for current user
   */
  async getMyProfile(): Promise<UserProfileResponse> {
    return await api.get<UserProfileResponse>('/users/me');
  },

  /**
   * GET /users/:id
   * Requires Bearer token and 'users:view' permission
   */
  async getUserById(id: number | string): Promise<UserProfileResponse> {
    return await api.get<UserProfileResponse>(`/users/${id}`);
  },

  /**
   * GET /users/positions
   * List of available job positions with defaultSalary string
   */
  async getPositions(): Promise<PositionOption[]> {
    return await api.get<PositionOption[]>('/users/positions');
  },

  /**
   * PATCH /users/me
   * Updates current user's profile (4 fields: phone, avatarUrl, dateOfBirth, address)
   */
  async updateMyProfile(
    payload: UpdateMyProfileDto,
  ): Promise<UserProfileResponse> {
    return await api.patch<UserProfileResponse>('/users/me', payload);
  },

  /**
   * PATCH /users/:id
   * Admin updates user profile (7 fields, requires 'users:update')
   */
  async updateUserProfile(
    id: number | string,
    payload: UpdateUserProfileDto,
  ): Promise<UserProfileResponse> {
    return await api.patch<UserProfileResponse>(`/users/${id}`, payload);
  },

  /**
   * GET /auth/sessions
   * List of active sessions for current user
   */
  async getSessions(): Promise<SessionItem[]> {
    return await api.get<SessionItem[]>('/auth/sessions');
  },

  /**
   * DELETE /auth/sessions/:sessionId
   * Revoke a single active session (204 No Content)
   */
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  /**
   * POST /auth/logout-all
   * Revokes all active sessions across all devices (including current)
   */
  async logoutAll(): Promise<{ revoked: number }> {
    return await api.post<{ revoked: number }>('/auth/logout-all');
  },

  /**
   * POST /auth/change-password
   * Changes password (204 No Content, all other sessions revoked)
   */
  async changePassword(data: ChangePasswordPayload): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  /**
   * POST /auth/email-verification
   * Request email verification code (200 OK)
   */
  async requestEmailVerification(): Promise<EmailVerificationRequestResponse> {
    return await api.post<EmailVerificationRequestResponse>(
      '/auth/email-verification',
    );
  },

  /**
   * POST /auth/verify-email
   * Submit 6-digit verification code
   */
  async verifyEmail(
    code: string,
  ): Promise<EmailVerificationConfirmResponse> {
    return await api.post<EmailVerificationConfirmResponse>(
      '/auth/verify-email',
      { code },
    );
  },
};
