import {
  AuthUser,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  SessionItem,
  SessionMeResponse,
  UserProfile,
} from '@/auth/lib/models';
import { api, apiClient } from '@/lib/axios.config';
import { tokenStore } from './token-store';

export const authService = {
  /**
   * POST /auth/login
   * Body: { username, password, audience? }
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const payload: LoginRequest = {
      username: credentials.username,
      password: credentials.password,
      audience: credentials.audience || 'web',
    };

    const response = await api.post<LoginResponse>('/auth/login', payload);
    const { accessToken, expiresIn } = response;

    // Save access token to RAM and set default header
    tokenStore.setAccessToken(accessToken);
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    return response;
  },

  /**
   * POST /auth/refresh
   * Sends httpOnly cookie inj_refresh_token automatically
   */
  async refresh(): Promise<RefreshResponse> {
    const response = await api.post<RefreshResponse>('/auth/refresh');
    const { accessToken } = response;

    // Update in-memory access token and default header
    tokenStore.setAccessToken(accessToken);
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    return response;
  },

  /**
   * POST /auth/logout
   * Always succeeds (204) even if cookie expired.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request completed with error:', error);
    } finally {
      delete apiClient.defaults.headers.common.Authorization;
      tokenStore.clear();
    }
  },

  /**
   * POST /auth/logout-all
   * Revokes all active sessions across all devices.
   */
  async logoutAll(): Promise<{ revoked: number }> {
    return await api.post<{ revoked: number }>('/auth/logout-all');
  },

  /**
   * GET /auth/me
   * Fast in-memory session identity check (0 DB queries)
   */
  async getMe(): Promise<SessionMeResponse> {
    return await api.get<SessionMeResponse>('/auth/me');
  },

  /**
   * GET /auth/sessions
   * List of active sessions for current user
   */
  async getSessions(): Promise<SessionItem[]> {
    return await api.get<SessionItem[]>('/auth/sessions');
  },

  /**
   * POST /auth/change-password
   * Body: { currentPassword, newPassword (min 12 chars) }
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  /**
   * GET /users/me
   * Complete employee profile information
   */
  async getProfile(): Promise<UserProfile> {
    return await api.get<UserProfile>('/users/me');
  },

  /**
   * GET /users/:id
   * Requires Bearer token and 'users:view' permission
   */
  async getUserById(id: number): Promise<UserProfile> {
    return await api.get<UserProfile>(`/users/${id}`);
  },
};
